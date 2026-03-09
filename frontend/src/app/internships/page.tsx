import InternshipsClient from './InternshipsClient';

// Helper to format "x days ago" - duplicated for server-side mapping
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 30) return `${diffInDays} days ago`;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

async function getInternships() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  try {
    // Use { cache: 'no-store' } to ensure the list is always fresh and shows newly posted internships immediately
    const res = await fetch(`${apiUrl}/internships`, { cache: 'no-store' });

    if (!res.ok) {
      // Handle error gracefully or return empty array
      console.error('Failed to fetch internships:', res.statusText);
      return [];
    }

    const json = await res.json();
    const data = json.data;

    // Transform data to match UI needs
    const mapped = data.map((item: any) => ({
      id: item._id,
      title: item.title,
      company: item.companyId?.companyName || 'Unknown Company',
      logo: item.companyId?.logo,
      location: item.mode === 'onsite' ? 'In-Office' : (item.mode.charAt(0).toUpperCase() + item.mode.slice(1)),
      mode: item.mode === 'onsite' ? 'In-Office' : (item.mode.charAt(0).toUpperCase() + item.mode.slice(1)),
      duration: `${item.durationWeeks} weeks`,
      stipend: item.stipend,
      description: item.description,
      skills: item.skillsRequired || [],
      openings: item.openings,
      postedAt: item.contentUpdatedAt
        ? `Edited ${formatTimeAgo(item.contentUpdatedAt)}`
        : formatTimeAgo(item.createdAt),
      // Pass raw dates for sorting in client if needed
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      contentUpdatedAt: item.contentUpdatedAt
    }));

    return mapped;

  } catch (error) {
    console.error('Error fetching internships:', error);
    return [];
  }
}

export default async function InternshipsPage() {
  const internships = await getInternships();

  return <InternshipsClient initialInternships={internships} />;
}
