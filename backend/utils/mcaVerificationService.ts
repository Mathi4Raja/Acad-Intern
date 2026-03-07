/**
 * MCA Verification Service
 * 
 * Uses RapidAPI to verify company CIN (Corporate Identification Number)
 * Primary: MCA Corporate Verifications API (by IDfy)
 * Fallback: MCA Company API (when primary fails or during rate limits)
 */

export interface McaCompanyData {
    cin: string;
    companyName: string;
    registrationDate?: string;
    status?: string;
    authorizedCapital?: string;
    paidUpCapital?: string;
    registeredOffice?: string;
    email?: string;
    category?: string;
    subCategory?: string;
    classOfCompany?: string;
    source: 'primary' | 'fallback';
    rawData?: Record<string, unknown>;
}

export interface VerificationResult {
    success: boolean;
    data?: McaCompanyData;
    error?: string;
}

// Response types for the APIs
interface PrimaryApiResponse {
    result?: {
        extraction_output?: {
            registration_number?: string;
            company_name?: string;
            name?: string;
            incorporation_date?: string;
            date_of_registration?: string;
            company_status?: string;
            status?: string;
            authorized_capital?: string;
            paid_up_capital?: string;
            registered_address?: string;
            registered_office?: string;
            email?: string;
            company_category?: string;
            company_sub_category?: string;
            class_of_company?: string;
        };
    };
    error?: {
        message?: string;
    };
}

interface FallbackApiResponse {
    cin?: string;
    CIN?: string;
    company_name?: string;
    companyName?: string;
    date_of_registration?: string;
    dateOfRegistration?: string;
    registrationDate?: string;
    company_status?: string;
    companyStatus?: string;
    status?: string;
    authorized_capital?: string;
    authorizedCapital?: string;
    paid_up_capital?: string;
    paidUpCapital?: string;
    registered_office?: string;
    registeredOffice?: string;
    email?: string;
    company_category?: string;
    companyCategory?: string;
    company_sub_category?: string;
    companySubCategory?: string;
    class_of_company?: string;
    classOfCompany?: string;
    error?: string;
    message?: string;
}

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Primary API: MCA Corporate Verifications (IDfy)
const PRIMARY_API = {
    host: 'mca-corporate-verifications.p.rapidapi.com',
    baseUrl: 'https://mca-corporate-verifications.p.rapidapi.com'
};

// Fallback API: MCA Company API
const FALLBACK_API = {
    host: 'mca-company-api.p.rapidapi.com',
    baseUrl: 'https://mca-company-api.p.rapidapi.com'
};

/**
 * Verify CIN using Primary API (MCA Corporate Verifications)
 * Uses async flow: POST to submit, then GET to poll for results
 */
async function verifyWithPrimaryApi(cin: string): Promise<VerificationResult> {
    if (!RAPIDAPI_KEY) {
        return { success: false, error: 'RapidAPI key not configured' };
    }

    try {
        const taskId = `cin_verify_${Date.now()}`;

        // Step 1: Submit async verification request
        // Note: Using ind_mca endpoint (correct path from RapidAPI documentation)
        const submitResponse = await fetch(`${PRIMARY_API.baseUrl}/v3/tasks/async/verify_with_source/ind_mca`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': PRIMARY_API.host,
                'x-rapidapi-key': RAPIDAPI_KEY
            },
            body: JSON.stringify({
                task_id: taskId,
                group_id: 'company_verification',
                data: {
                    cin: cin
                }
            })
        });

        if (!submitResponse.ok) {
            const errorText = await submitResponse.text();
            console.error(`Primary API submit error (${submitResponse.status}):`, errorText);
            return { success: false, error: `Primary API failed: ${submitResponse.status}` };
        }

        const submitResult = await submitResponse.json() as { request_id?: string };
        const requestId = submitResult.request_id || taskId;

        // Step 2: Poll for results (with timeout)
        // Optimized: Let's wait 4.5 seconds BEFORE the very first GET request. 
        // IDfy usually finishes processing in 3-5 seconds. This huge initial delay 
        // prevents us from wasting RapidAPI quota on 'pending' responses.
        await new Promise(resolve => setTimeout(resolve, 4500));

        // Step 2: Custom Poll Strategy requested by user: Wait 30s -> GET -> Wait 20s -> GET

        console.log(`Initial 30s wait for ${requestId}...`);
        await new Promise(resolve => setTimeout(resolve, 30000));

        let pollResponse = await fetch(`${PRIMARY_API.baseUrl}/v3/tasks?request_id=${requestId}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': PRIMARY_API.host,
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        if (pollResponse.ok) {
            const pollResult = await pollResponse.json() as PrimaryApiResponse;
            if (pollResult.result && pollResult.result.extraction_output) {
                const data = pollResult.result.extraction_output;
                return {
                    success: true,
                    data: {
                        cin: data.registration_number || cin,
                        companyName: data.company_name || data.name || '',
                        registrationDate: data.incorporation_date || data.date_of_registration,
                        status: data.company_status || data.status,
                        authorizedCapital: data.authorized_capital,
                        paidUpCapital: data.paid_up_capital,
                        registeredOffice: data.registered_address || data.registered_office,
                        email: data.email,
                        category: data.company_category,
                        subCategory: data.company_sub_category,
                        classOfCompany: data.class_of_company,
                        source: 'primary',
                        rawData: data as unknown as Record<string, unknown>
                    }
                };
            }
        }

        console.log(`First poll missed. Secondary 20s wait for ${requestId}...`);
        await new Promise(resolve => setTimeout(resolve, 20000));

        pollResponse = await fetch(`${PRIMARY_API.baseUrl}/v3/tasks?request_id=${requestId}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': PRIMARY_API.host,
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        if (pollResponse.ok) {
            const pollResult = await pollResponse.json() as PrimaryApiResponse;
            if (pollResult.result && pollResult.result.extraction_output) {
                const data = pollResult.result.extraction_output;
                return {
                    success: true,
                    data: {
                        cin: data.registration_number || cin,
                        companyName: data.company_name || data.name || '',
                        registrationDate: data.incorporation_date || data.date_of_registration,
                        status: data.company_status || data.status,
                        authorizedCapital: data.authorized_capital,
                        paidUpCapital: data.paid_up_capital,
                        registeredOffice: data.registered_address || data.registered_office,
                        email: data.email,
                        category: data.company_category,
                        subCategory: data.company_sub_category,
                        classOfCompany: data.class_of_company,
                        source: 'primary',
                        rawData: data as unknown as Record<string, unknown>
                    }
                };
            }
            if (pollResult.error) {
                return { success: false, error: pollResult.error.message || 'Primary API verification failed' };
            }
        }

        return { success: false, error: 'Primary API timeout waiting for results' };
    } catch (error) {
        console.error('Primary API exception:', error);
        return { success: false, error: `Primary API exception: ${(error as Error).message}` };
    }
}

/**
 * Verify CIN using Fallback API (MCA Company API)
 */
async function verifyWithFallbackApi(cin: string): Promise<VerificationResult> {
    if (!RAPIDAPI_KEY) {
        return { success: false, error: 'RapidAPI key not configured' };
    }

    try {
        const response = await fetch(`${FALLBACK_API.baseUrl}/api/v1/company/${encodeURIComponent(cin)}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': FALLBACK_API.host,
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Fallback API error (${response.status}):`, errorText);
            return { success: false, error: `Fallback API failed: ${response.status}` };
        }

        const result = await response.json() as FallbackApiResponse;

        // Check if we got valid company data
        if (result && (result.company_name || result.companyName)) {
            return {
                success: true,
                data: {
                    cin: result.cin || result.CIN || cin,
                    companyName: result.company_name || result.companyName || '',
                    registrationDate: result.date_of_registration || result.dateOfRegistration || result.registrationDate,
                    status: result.company_status || result.companyStatus || result.status,
                    authorizedCapital: result.authorized_capital || result.authorizedCapital,
                    paidUpCapital: result.paid_up_capital || result.paidUpCapital,
                    registeredOffice: result.registered_office || result.registeredOffice,
                    email: result.email,
                    category: result.company_category || result.companyCategory,
                    subCategory: result.company_sub_category || result.companySubCategory,
                    classOfCompany: result.class_of_company || result.classOfCompany,
                    source: 'fallback',
                    rawData: result as unknown as Record<string, unknown>
                }
            };
        }

        if (result.error || result.message) {
            return { success: false, error: result.error || result.message };
        }

        return { success: false, error: 'Fallback API returned empty response' };
    } catch (error) {
        console.error('Fallback API exception:', error);
        return { success: false, error: `Fallback API exception: ${(error as Error).message}` };
    }
}

/**
 * Verify company CIN with automatic fallback
 * 
 * Tries Primary API (MCA Corporate Verifications) first,
 * falls back to MCA Company API if primary fails
 */
export async function verifyCin(cin: string): Promise<VerificationResult> {
    // Validate CIN format (basic check)
    // Indian CIN format: L74899DL1995PLC069802 (21 characters)
    const cinRegex = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

    if (!cin || typeof cin !== 'string') {
        return { success: false, error: 'CIN is required' };
    }

    const normalizedCin = cin.toUpperCase().trim();

    if (!cinRegex.test(normalizedCin)) {
        return {
            success: false,
            error: 'Invalid CIN format. Expected format: L74899DL1995PLC069802 (21 characters)'
        };
    }

    // Try primary API first
    console.log(`Verifying CIN ${normalizedCin} with primary API...`);
    const primaryResult = await verifyWithPrimaryApi(normalizedCin);

    if (primaryResult.success) {
        console.log('CIN verified successfully with primary API');
        return primaryResult;
    }

    // Primary failed, try fallback
    console.log(`Primary API failed: ${primaryResult.error}. Trying fallback API...`);
    const fallbackResult = await verifyWithFallbackApi(normalizedCin);

    if (fallbackResult.success) {
        console.log('CIN verified successfully with fallback API');
        return fallbackResult;
    }

    // Both APIs failed
    console.error('Both APIs failed to verify CIN');
    return {
        success: false,
        error: `Verification failed. Primary: ${primaryResult.error}. Fallback: ${fallbackResult.error}`
    };
}
