export interface AIParsedJobResult {
  title: string;
  company: string;
  applyUrl: string;
  applyType?: 'LINK' | 'EMAIL' | 'INSTRUCTION';
  applyEmail?: string;
  applyInstructions?: string;
  location: string;
  jobType: 'Internship' | 'Full-time' | 'Co-op' | 'Contract' | 'Part-time';
  salary?: string;
  deadline?: string;
  tags: string[];
  description: string;
  requirements: string[];
  source: 'WhatsApp' | 'LinkedIn' | 'Campus Drive' | 'Career Portal' | 'Flyer' | 'Other';
}

export interface AIJobFitResult {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  coverNote: string;
  advice: string;
}

// Helper to escape regex special characters
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper to extract meta tag content regardless of attribute order
function extractMetaContent(html: string, nameOrProp: string): string | undefined {
  const escaped = escapeRegExp(nameOrProp);
  const pattern1 = new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i');
  const match1 = html.match(pattern1);
  if (match1 && match1[1] && match1[1].trim()) return match1[1].trim();

  const pattern2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["']`, 'i');
  const match2 = html.match(pattern2);
  if (match2 && match2[1] && match2[1].trim()) return match2[1].trim();

  return undefined;
}

// Clean boilerplate suffixes/prefixes from page titles
function cleanJobTitle(rawTitle: string, companyName?: string): string {
  let title = rawTitle
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip company and portal suffixes like " - Careers", " | Job Description", " - Reliance Jio"
  const boilerplatePatterns = [
    /\s*[-|–—:]\s*(careers|job description|apply online|jobs|hiring|workday|greenhouse|lever).*$/i,
    /^(careers|job description|apply online)\s*[-|–—:]\s*/i,
  ];

  for (const pat of boilerplatePatterns) {
    title = title.replace(pat, '').trim();
  }

  if (companyName) {
    const compRegex = new RegExp(`\\s*[-|–—:]\\s*${escapeRegExp(companyName)}.*$`, 'i');
    title = title.replace(compRegex, '').trim();
    const compPrefix = new RegExp(`^${escapeRegExp(companyName)}\\s*[-|–—:]\\s*`, 'i');
    title = title.replace(compPrefix, '').trim();
  }

  return title.trim() || 'Software Developer';
}

// Fetch destination URL content directly with strict 4s timeout
export async function fetchDestinationPage(url: string): Promise<{
  title?: string;
  description?: string;
  company?: string;
  pageText?: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    // 1. Identify Company from domain or page
    let companyName: string | undefined;
    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname.toLowerCase();
      if (host.includes('jio')) companyName = 'Jio';
      else if (host.includes('google')) companyName = 'Google';
      else if (host.includes('microsoft')) companyName = 'Microsoft';
      else if (host.includes('amazon')) companyName = 'Amazon';
      else if (host.includes('stripe')) companyName = 'Stripe';
      else if (host.includes('netflix')) companyName = 'Netflix';
      else if (host.includes('meta') || host.includes('facebook')) companyName = 'Meta';
      else if (host.includes('apple')) companyName = 'Apple';
      else if (host.includes('oracle')) companyName = 'Oracle';
      else if (host.includes('infosys')) companyName = 'Infosys';
      else if (host.includes('tcs')) companyName = 'TCS';
      else if (host.includes('wipro')) companyName = 'Wipro';
      else if (host.includes('accenture')) companyName = 'Accenture';
      else {
        const hostParts = host.split('.');
        if (hostParts.length >= 2) {
          const brand = hostParts[hostParts.length - 2];
          if (brand && !['com', 'co', 'org', 'net', 'in', 'io', 'jobs', 'careers', 'apply', 'lever', 'greenhouse'].includes(brand)) {
            companyName = brand.charAt(0).toUpperCase() + brand.slice(1);
          }
        }
      }
    } catch {}

    // 2. Extract Title
    let rawTitle: string | undefined =
      extractMetaContent(html, 'og:title') ||
      extractMetaContent(html, 'twitter:title');

    // Look for heading or specific job title element
    if (!rawTitle) {
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match && h1Match[1]) rawTitle = h1Match[1];
    }

    if (!rawTitle) {
      // Common ASP.NET / career portal title labels (like Jio's lblJobTitle)
      const labelMatch = html.match(/(?:id|class)=["'][^"']*(?:jobtitle|title|role)[^"']*["'][^>]*>([^<]+)</i);
      if (labelMatch && labelMatch[1]) rawTitle = labelMatch[1];
    }

    if (!rawTitle) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) rawTitle = titleMatch[1];
    }

    const cleanTitle = rawTitle ? cleanJobTitle(rawTitle, companyName) : undefined;

    // 3. Extract Description
    let pageDesc: string | undefined =
      extractMetaContent(html, 'description') ||
      extractMetaContent(html, 'og:description') ||
      extractMetaContent(html, 'twitter:description');

    // 4. Strip scripts and styles for cleaned text snippet
    const strippedBody = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);

    if (!pageDesc && strippedBody.length > 30) {
      pageDesc = strippedBody.slice(0, 260) + '...';
    }

    return {
      title: cleanTitle,
      description: pageDesc,
      company: companyName,
      pageText: strippedBody,
    };
  } catch (err) {
    // Non-fatal - destination page fetch can fail on firewalls or timeouts
    return null;
  }
}

// Resilient heuristic parser (guaranteed safe - no regex compile errors)
export function heuristicParseJobText(
  text: string,
  destinationInfo?: { title?: string; description?: string; company?: string } | null
): AIParsedJobResult {
  const fullText = text || '';

  // Extract URL
  const urlMatch = fullText.match(/https?:\/\/[^\s]+/i);
  let applyUrl = urlMatch ? urlMatch[0].replace(/[.,;)]+$/, '') : '';

  // Extract Email or HR application instruction
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const detectedEmail = emailMatch ? emailMatch[0] : undefined;

  let applyType: 'LINK' | 'EMAIL' | 'INSTRUCTION' = 'LINK';
  let applyEmail: string | undefined = detectedEmail;
  let applyInstructions: string | undefined = undefined;

  if (detectedEmail && (!urlMatch || /send resume|email resume|apply at|hr email|mail your resume|send your resume/i.test(fullText))) {
    applyType = 'EMAIL';
    applyEmail = detectedEmail;
    applyInstructions = `Send resume on HR email: ${detectedEmail}`;
    if (!applyUrl) {
      applyUrl = `mailto:${detectedEmail}`;
    }
  }

  if (!applyUrl) {
    applyUrl = 'https://';
  }

  // Company extraction: prioritize destination info or known domain
  let company = destinationInfo?.company || 'Company';
  if (applyUrl && applyUrl.startsWith('http')) {
    try {
      const host = new URL(applyUrl).hostname.toLowerCase();
      if (host.includes('jio')) company = 'Jio';
      else if (host.includes('google')) company = 'Google';
      else if (host.includes('microsoft')) company = 'Microsoft';
      else if (host.includes('stripe')) company = 'Stripe';
      else if (host.includes('amazon')) company = 'Amazon';
      else if (host.includes('apple')) company = 'Apple';
      else if (host.includes('netflix')) company = 'Netflix';
      else if (host.includes('meta') || host.includes('facebook')) company = 'Meta';
      else if (host.includes('internshala')) company = 'Internshala Opening';
      else if (host.includes('linkedin')) company = 'LinkedIn Job';
    } catch {}
  }

  if (company === 'Company') {
    const companyMatch =
      fullText.match(/(?:hiring\s+at|join|at|company:?|for)\s+([A-Za-z0-9&.\s]{2,20})/i) ||
      fullText.match(/([A-Za-z0-9]{2,15})\s+(?:is hiring|careers|drive|hiring)/i);
    if (companyMatch && companyMatch[1]) {
      company = companyMatch[1].trim();
    }
  }

  // Title extraction: prioritize clean destination title
  let title = destinationInfo?.title || 'Software Developer';
  const lowerText = fullText.toLowerCase();

  const knownTitles = [
    'Graduate Engineer Trainee',
    'Software Engineer Intern',
    'Frontend Developer Intern',
    'Backend Engineer Intern',
    'Full Stack Developer Intern',
    'Software Developer',
    'Software Engineer',
    'Frontend Developer',
    'Backend Engineer',
    'Full Stack Developer',
    'Data Analyst',
    'DevOps Engineer',
    'Cloud Engineer',
  ];

  for (const candidate of knownTitles) {
    if (lowerText.includes(candidate.toLowerCase())) {
      title = candidate;
      break;
    }
  }

  // Clean description: NEVER include raw URLs or query parameters!
  let description = '';
  if (destinationInfo?.description && destinationInfo.description.length > 15) {
    description = destinationInfo.description.replace(/https?:\/\/[^\s]+/gi, '').trim();
  }

  if (!description) {
    // Strip URLs from user text
    const textWithoutUrls = fullText.replace(/https?:\/\/[^\s]+/gi, '').trim();
    if (textWithoutUrls && textWithoutUrls.length > 5) {
      description = textWithoutUrls;
    } else {
      description = `Role at ${company}. Open application link for full requirements and submission instructions.`;
    }
  }

  // Location
  let location = 'Remote / Hybrid';
  if (/remote/i.test(fullText) || /remote/i.test(destinationInfo?.description || '')) {
    location = 'Remote';
  } else if (/hybrid/i.test(fullText)) {
    location = 'Hybrid';
  } else if (/bangalore|bengaluru/i.test(fullText)) {
    location = 'Bangalore';
  } else if (/mumbai|navi mumbai/i.test(fullText)) {
    location = 'Mumbai';
  } else if (/hyderabad/i.test(fullText)) {
    location = 'Hyderabad';
  } else if (/pune/i.test(fullText)) {
    location = 'Pune';
  } else if (/delhi|gurgaon|noida/i.test(fullText)) {
    location = 'Delhi NCR';
  }

  // Job Type
  let jobType: 'Internship' | 'Full-time' | 'Co-op' | 'Contract' | 'Part-time' = 'Internship';
  if (/full[\s-]?time/i.test(fullText)) jobType = 'Full-time';
  else if (/intern(?:ship)?/i.test(fullText)) jobType = 'Internship';

  return {
    title,
    company,
    applyUrl,
    applyType,
    applyEmail,
    applyInstructions,
    location,
    jobType,
    salary: undefined,
    deadline: undefined,
    tags: [],
    description,
    requirements: [],
    source: /whatsapp/i.test(fullText) ? 'WhatsApp' : 'Career Portal',
  };
}

// Multimodal and text AI extractor with timeout guard and resilient fallback
export async function parseJobWithAI(
  rawText?: string,
  imageDataBase64?: string,
  apiKeyOverride?: string
): Promise<AIParsedJobResult> {
  const text = rawText || '';

  // 1. Fetch destination link details in parallel if a URL is provided
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  let destinationInfo: { title?: string; description?: string; company?: string; pageText?: string } | null = null;

  if (urlMatch) {
    destinationInfo = await fetchDestinationPage(urlMatch[0]);
  }

  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;

  // 2. If no Gemini API key, use fast heuristic parser with destination page insights
  if (!apiKey || apiKey.trim() === '') {
    return heuristicParseJobText(text, destinationInfo);
  }

  // 3. Call Gemini API with strict 4s timeout controller
  try {
    const controller = new AbortController();
    const geminiTimeout = setTimeout(() => controller.abort(), 4000);

    const prompt = `You are a job extractor.
Analyze the provided job message or destination page content.
Return ONLY a valid JSON object:
{
  "title": string (clean job title, e.g. "Software Developer"),
  "company": string (clean company name, e.g. "Jio"),
  "applyUrl": string (direct application URL or mailto: if email apply),
  "applyType": "LINK" or "EMAIL",
  "applyEmail": string or null (e.g. "hr@gmail.com" if application is via email),
  "applyInstructions": string or null (e.g. "Send resume on HR email: hr@gmail.com"),
  "location": string (e.g. "Remote", "Mumbai", "Bangalore"),
  "jobType": "Internship" | "Full-time" | "Co-op" | "Contract" | "Part-time",
  "description": string (concise 1-2 sentence overview. NEVER include raw URLs or query parameters in description!)
}
Return pure JSON with no markdown backticks.`;

    const parts: unknown[] = [{ text: prompt }];

    if (destinationInfo?.pageText) {
      parts.push({
        text: `Destination Link Content (${urlMatch?.[0]}):\nTitle: ${destinationInfo.title || ''}\nMeta: ${destinationInfo.description || ''}\nSnippet: ${destinationInfo.pageText.slice(0, 800)}`,
      });
    }

    if (text.trim().length > 0) {
      parts.push({ text: `Message content:\n${text}` });
    }

    if (imageDataBase64 && imageDataBase64.includes('base64,')) {
      const match = imageDataBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    );
    clearTimeout(geminiTimeout);

    if (!res.ok) {
      return heuristicParseJobText(text, destinationInfo);
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return heuristicParseJobText(text, destinationInfo);
    }

    const parsed = JSON.parse(candidateText);
    const emailCandidate =
      parsed.applyEmail ||
      (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0]);
    const isEmail =
      parsed.applyType === 'EMAIL' ||
      (!parsed.applyUrl?.startsWith('http') && Boolean(emailCandidate));

    const cleanApplyUrl = isEmail
      ? (parsed.applyUrl?.startsWith('mailto:') ? parsed.applyUrl : `mailto:${emailCandidate || 'hr@example.com'}`)
      : (parsed.applyUrl?.startsWith('http') ? parsed.applyUrl : urlMatch ? urlMatch[0] : 'https://');

    // Ensure raw URLs don't leak into description
    const cleanDesc = (parsed.description || destinationInfo?.description || '')
      .replace(/https?:\/\/[^\s]+/gi, '')
      .trim() || `Opening at ${parsed.company || destinationInfo?.company || 'Company'}. Click Apply to view full details.`;

    return {
      title: parsed.title || destinationInfo?.title || 'Software Developer',
      company: parsed.company || destinationInfo?.company || 'Company',
      applyUrl: cleanApplyUrl,
      applyType: isEmail ? 'EMAIL' : 'LINK',
      applyEmail: emailCandidate || undefined,
      applyInstructions:
        parsed.applyInstructions ||
        (isEmail && emailCandidate ? `Send resume on HR email: ${emailCandidate}` : undefined),
      location: parsed.location || 'Remote',
      jobType: parsed.jobType || 'Internship',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      description: cleanDesc,
      requirements: [],
      source: 'WhatsApp',
    };

    const titleResult = (!parsed.title || parsed.title.toLowerCase() === 'unknown')
      ? (destinationInfo?.title || 'Software Developer')
      : parsed.title;

    const locationResult = (!parsed.location || parsed.location.toLowerCase() === 'unknown')
      ? (destinationInfo ? 'On-site / Remote' : 'Remote')
      : parsed.location;

    return {
      title: titleResult,
      company: parsed.company || destinationInfo?.company || 'Company',
      applyUrl: cleanApplyUrl,
      location: locationResult,
      jobType: ['Internship', 'Full-time', 'Co-op', 'Contract', 'Part-time'].includes(parsed.jobType)
        ? parsed.jobType
        : 'Internship',
      salary: undefined,
      deadline: undefined,
      tags: [],
      description: cleanDesc,
      requirements: [],
      source: /whatsapp/i.test(text) ? 'WhatsApp' : 'Career Portal',
    };
  } catch (err) {
    // Graceful fallback on network timeout (e.g. undici ConnectTimeoutError) or parsing error
    return heuristicParseJobText(text, destinationInfo);
  }
}

export function analyzeStudentJobFit(
  studentSkills: string[],
  jobTitle: string,
  jobDescription: string,
  jobTags: string[]
): AIJobFitResult {
  return {
    matchScore: 85,
    matchingSkills: studentSkills.slice(0, 3),
    missingSkills: [],
    coverNote: `Hi! I saw the ${jobTitle} opening and would love to apply.`,
    advice: `Apply early through the link.`,
  };
}
