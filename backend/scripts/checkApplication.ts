import 'dotenv/config';
import mongoose from 'mongoose';
import Application from '../models/Application';
import Company from '../models/Company';
import User from '../models/User';
import Internship from '../models/Internship';

async function checkApplication() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    
    const applicationId = '6974da62cb7d3b292b93ba57';
    const companyUserId = '6973661fdfd7ade10f292d7d';
    
    console.log('🔍 Checking application access...');
    console.log(`Application ID: ${applicationId}`);
    console.log(`Company User ID: ${companyUserId}`);
    
    const app = await Application.findById(applicationId);
    
    if (!app) {
        console.log('❌ Application not found');
        return;
    }
    
    console.log('\n📋 Application Details:');
    console.log(`  Student ID: ${app.studentId}`);
    console.log(`  Internship ID: ${app.internshipId}`);
    
    const internship = await Internship.findById(app.internshipId);
    
    if (!internship) {
        console.log('❌ Internship not found');
        return;
    }
    
    console.log(`  Company ID: ${internship.companyId}`);
    
    const company = await Company.findById(internship.companyId);
    
    if (!company) {
        console.log('❌ Company not found');
        return;
    }
    
    console.log('\n🏢 Company Details:');
    console.log(`  Company ID: ${company._id}`);
    console.log(`  Company Name: ${company.companyName}`);
    console.log(`  User ID: ${company.userId}`);
    
    const companyUser = await User.findById(company.userId);
    console.log(`  User Name: ${companyUser?.name}`);
    
    console.log('\n🔐 Authorization Check:');
    console.log(`  Company User ID: ${companyUserId}`);
    console.log(`  Company's User ID: ${company.userId}`);
    console.log(`  Match: ${company.userId.toString() === companyUserId}`);
    
    // Check if the company user has access
    const hasAccess = await Company.findOne({
        _id: internship.companyId,
        userId: companyUserId
    });
    
    console.log(`  Has Access: ${!!hasAccess}`);
    
    mongoose.connection.close();
}

checkApplication().catch(console.error);