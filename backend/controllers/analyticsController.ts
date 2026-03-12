import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import Application from '../models/Application';
import ProfileView from '../models/ProfileView';
import StudentProfile from '../models/StudentProfile';
import Internship from '../models/Internship';
import User from '../models/User';

// @desc    Get student analytics
// @route   GET /api/analytics/student
// @access  Private (Student only)
export const getStudentAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const studentId = req.user?.id;

        if (!studentId) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        // Helper: Calculate Trend Percentage
        const calculateTrend = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0; // Baseline 100% if starting from 0

            // Return raw percentage (e.g. 5000 for 50x growth)
            return Math.round(((current - previous) / previous) * 100);
        };

        const stats = {
            profileViews: {
                total: 0,
                trend: 0,
                history: [] as { label: string, value: number }[]
            },
            searchAppearances: {
                total: 0,
                trend: 0,
                history: [] as { label: string, value: number }[]
            },
            applicationRate: {
                value: "0%",
                trend: 0
            },
            profileStrength: {
                value: "0%",
                trend: 0
            },
            topSkillsDemand: [] as { label: string, value: number, color: string }[],
            skillMatch: [] as { name: string, studentLevel: number, requiredLevel: number }[],
            companiesViewed: [] as { name: string, views: number, date: string }[]
        };

        // Date Ranges
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(now.getDate() - 60);

        // 1. Profile Views & Search Appearances
        // Fetch last 60 days to calculate trends (Current 30 vs Previous 30)
        const allViews = await ProfileView.find({
            profileOwnerId: studentId,
            viewedAt: { $gte: sixtyDaysAgo }
        }).sort({ viewedAt: 1 });

        // Split into Current (Last 30 days) and Previous (30-60 days ago)
        const currentViews = allViews.filter(v => new Date(v.viewedAt) >= thirtyDaysAgo);
        const previousViews = allViews.filter(v => new Date(v.viewedAt) < thirtyDaysAgo);

        // -- Profile Views
        const currentProfileViews = currentViews.filter(v => v.viewType === 'profile_view');
        const previousProfileViews = previousViews.filter(v => v.viewType === 'profile_view');

        stats.profileViews.total = currentProfileViews.length;
        stats.profileViews.trend = calculateTrend(currentProfileViews.length, previousProfileViews.length);

        // -- Search Appearances
        const currentSearchApps = currentViews.filter(v => v.viewType === 'search_appearance');
        const previousSearchApps = previousViews.filter(v => v.viewType === 'search_appearance');

        stats.searchAppearances.total = currentSearchApps.length;
        stats.searchAppearances.trend = calculateTrend(currentSearchApps.length, previousSearchApps.length);

        // -- History Graphs (Real Data Aggregation)
        const generateDailyData = (data: any[], days = 7) => {
            const result = [];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dayStart = new Date(d.setHours(0, 0, 0, 0));
                const dayEnd = new Date(d.setHours(23, 59, 59, 999));

                const count = data.filter(item =>
                    new Date(item.viewedAt) >= dayStart &&
                    new Date(item.viewedAt) <= dayEnd
                ).length;

                result.push({
                    label: dayNames[dayStart.getDay()],
                    value: count
                });
            }
            return result;
        };

        stats.profileViews.history = generateDailyData(currentProfileViews, 7);

        // Search Appearances Weekly History (Last 4 weeks)
        const generateWeeklyData = (data: any[]) => {
            const result = [];
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
                const weekEnd = new Date();
                weekEnd.setDate(weekEnd.getDate() - i * 7);

                const count = data.filter(item =>
                    new Date(item.viewedAt) >= weekStart &&
                    new Date(item.viewedAt) < weekEnd
                ).length;

                result.push({ label: `Week ${4 - i}`, value: count });
            }
            return result;
        };
        stats.searchAppearances.history = generateWeeklyData(currentSearchApps);


        // 2. Application Rate (response rate: shortlisted+ / total applications this period)
        const applications = await Application.find({ studentId });
        const positiveStatuses = ['shortlisted', 'interview_scheduled', 'assessment_completed', 'accepted'];

        const currentApps = applications.filter(a => {
            const d = new Date((a as any).appliedAt || (a as any).createdAt);
            return d >= thirtyDaysAgo;
        });

        const previousApps = applications.filter(a => {
            const d = new Date((a as any).appliedAt || (a as any).createdAt);
            return d >= sixtyDaysAgo && d < thirtyDaysAgo;
        });

        const currentSuccessful = currentApps.filter(a => positiveStatuses.includes(a.status));
        const previousSuccessful = previousApps.filter(a => positiveStatuses.includes(a.status));

        const currentRate = currentApps.length > 0
            ? (currentSuccessful.length / currentApps.length) * 100
            : 0;
        const previousRate = previousApps.length > 0
            ? (previousSuccessful.length / previousApps.length) * 100
            : 0;

        stats.applicationRate.value = `${currentRate.toFixed(1)}%`;
        stats.applicationRate.trend = calculateTrend(currentRate, previousRate);

        // 3. Profile Strength — use the stored completenessScore for consistency with updateProfile
        const profile = await StudentProfile.findOne({ userId: studentId });
        if (profile) {
            stats.profileStrength.value = `${profile.completenessScore ?? 0}%`;
            stats.profileStrength.trend = 0;
        }

        // 4. Companies Viewed (Real Data)
        const uniqueViewers = [...new Set(currentProfileViews.map(v => v.viewerId.toString()))];
        const companies = await User.find({ _id: { $in: uniqueViewers }, role: 'company' });
        const companyMap = new Map(companies.map(c => [c._id.toString(), c.name]));

        stats.companiesViewed = currentProfileViews
            .filter(v => v.viewerRole === 'company')
            .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()) // Newest first
            .slice(0, 5)
            .map(v => ({
                name: companyMap.get(v.viewerId.toString()) || 'Unknown Company',
                views: 1, // Individual view record
                date: new Date(v.viewedAt).toLocaleDateString()
            }));

        // 5. Skills Demand (Real Aggregation)
        const allInternships = await Internship.find({ status: 'active' }).select('skillsRequired');
        const skillCounts: Record<string, number> = {};
        allInternships.forEach(i => {
            i.skillsRequired.forEach(skill => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });

        stats.topSkillsDemand = Object.entries(skillCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([label, value], index) => ({
                label,
                value,
                color: ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'][index % 5]
            }));

        // 6. Skill Match (Real Comparison)
        if (profile && profile.skills) {
            const mySkills = new Set(profile.skills.map(s => s.toLowerCase()));
            stats.skillMatch = stats.topSkillsDemand.map(marketSkill => ({
                name: marketSkill.label,
                studentLevel: mySkills.has(marketSkill.label.toLowerCase()) ? 90 : 20, // Present=90, Absent=20
                requiredLevel: 80
            }));
        }

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        next(error);
    }
};
