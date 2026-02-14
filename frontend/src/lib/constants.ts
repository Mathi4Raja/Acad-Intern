export const DEPARTMENTS = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Business Administration',
    'Data Science',
    'Artificial Intelligence',
    'Other'
];

export const INTERNSHIP_MODES = [
    { value: 'remote', label: 'Remote' },
    { value: 'onsite', label: 'On-site' },
    { value: 'hybrid', label: 'Hybrid' }
];

export const APPLICATION_STATUSES = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'shortlisted', label: 'Shortlisted', color: 'blue' },
    { value: 'interview_scheduled', label: 'Interview Scheduled', color: 'purple' },
    { value: 'assessment_completed', label: 'Assessment Done', color: 'indigo' },
    { value: 'accepted', label: 'Selected', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
    { value: 'expired', label: 'Expired', color: 'gray' }
];

export const INDUSTRIES = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'E-commerce',
    'Manufacturing',
    'Marketing',
    'Design',
    'Other'
];

export const COMPANY_SIZES = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1000+'
];

export const getLabel = (list: { value: string; label: string }[], value: string) => {
    return list.find(item => item.value === value)?.label || value;
};
