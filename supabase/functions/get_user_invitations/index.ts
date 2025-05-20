
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Inline cors headers from _shared/cors.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a response with CORS headers
function createResponse(body: any, status = 200, headers: Record<string, string> = {}) {
  return new Response(
    JSON.stringify(body),
    { 
      status, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60, stale-while-revalidate=300',
        ...headers
      } 
    }
  );
}

// Simple in-memory cache for the edge function
interface CacheEntry {
  data: any;
  timestamp: number;
  etag: string;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60000; // 60 second cache TTL
const CACHE_CLEANUP_INTERVAL = 300000; // Clean up every 5 minutes

// Track invitations count per user for rate limiting
interface RateLimitState {
  count: number;
  resetAt: number;
  firstRequestAt: number;
}

const rateLimits = new Map<string, RateLimitState>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute window
const RATE_LIMIT_MAX = 10; // Max 10 requests per minute per user
const RATE_LIMIT_CLEANUP_INTERVAL = 600000; // Clean up rate limit records every 10 minutes

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean cache
  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
  
  // Clean rate limits
  for (const [key, state] of rateLimits.entries()) {
    if (now > state.resetAt) {
      rateLimits.delete(key);
    }
  }
}, Math.min(CACHE_CLEANUP_INTERVAL, RATE_LIMIT_CLEANUP_INTERVAL));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return createResponse({ error: 'Email is required' }, 400);
    }
    
    // Generate cache key from email
    const cacheKey = email.toLowerCase().trim();
    
    // Apply rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `${cacheKey}:${clientIp}`;
    
    // Check if user is rate limited
    if (rateLimits.has(rateLimitKey)) {
      const limitState = rateLimits.get(rateLimitKey)!;
      const now = Date.now();
      
      // Reset rate limit if window has passed
      if (now > limitState.resetAt) {
        rateLimits.set(rateLimitKey, {
          count: 1,
          resetAt: now + RATE_LIMIT_WINDOW,
          firstRequestAt: now
        });
      } else {
        // Increment count within window
        limitState.count++;
        
        // If exceeded limit, return 429
        if (limitState.count > RATE_LIMIT_MAX) {
          const retryAfterSecs = Math.ceil((limitState.resetAt - now) / 1000);
          return createResponse(
            { error: 'Rate limit exceeded. Please try again later.' },
            429,
            { 'Retry-After': `${retryAfterSecs}` }
          );
        }
        
        rateLimits.set(rateLimitKey, limitState);
      }
    } else {
      // First request from this user/IP
      rateLimits.set(rateLimitKey, {
        count: 1,
        resetAt: Date.now() + RATE_LIMIT_WINDOW,
        firstRequestAt: Date.now()
      });
    }
    
    // Check for If-None-Match header for conditional requests
    const ifNoneMatch = req.headers.get('If-None-Match');
    
    // Check cache for a hit
    if (responseCache.has(cacheKey)) {
      const cachedEntry = responseCache.get(cacheKey)!;
      
      // If the client sent an ETag that matches our cached version and it's still fresh,
      // return a 304 Not Modified response
      if (ifNoneMatch === cachedEntry.etag && 
          (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
        return new Response(null, { 
          status: 304,
          headers: {
            ...corsHeaders,
            'ETag': cachedEntry.etag,
            'Cache-Control': 'max-age=60, stale-while-revalidate=300'
          }
        });
      }
      
      // If cache is still fresh but no ETag match, return the cached data
      if ((Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
        return createResponse(cachedEntry.data, 200, {
          'ETag': cachedEntry.etag,
          'X-Cache': 'HIT'
        });
      }
    }
    
    // Create Supabase admin client with service role to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Fetching invitations for email: ${normalizedEmail}`);
    
    // 1. Fetch team invitations
    const { data: teamInvitations, error: teamError } = await supabase
      .from('team_invitations')
      .select(`
        *,
        team:team_id (
          id,
          name,
          org_id,
          organization:org_id (
            name
          )
        )
      `)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      
    if (teamError) {
      console.error('Error fetching team invitations:', teamError);
      return createResponse({
        error: 'Failed to fetch team invitations',
        details: teamError.message
      }, 500);
    }
    
    // 2. Fetch organization invitations
    const { data: orgInvitations, error: orgError } = await supabase
      .from('organization_invitations')
      .select(`
        *,
        organization:org_id (
          id,
          name
        )
      `)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (orgError) {
      console.error('Error fetching organization invitations:', orgError);
      return createResponse({
        error: 'Failed to fetch organization invitations',
        details: orgError.message
      }, 500);
    }
    
    // Process team invitations to include team and org information
    const processedTeamInvitations = teamInvitations?.map(invite => ({
      ...invite,
      invitationType: 'team',
      team_name: invite.team?.name || 'Unknown Team',
      org_name: invite.team?.organization?.name || 'Unknown Organization',
    })) || [];
    
    // Process organization invitations to match the expected structure for the frontend
    const processedOrgInvitations = orgInvitations?.map(invite => ({
      ...invite,
      invitationType: 'organization',
      team: null,
      team_name: null,
      org_name: invite.organization?.name || 'Unknown Organization',
      // Fields required to match the team invitations structure
      team_id: null,
      role: invite.role || 'member',
    })) || [];
    
    // Combine both types of invitations
    const allInvitations = [...processedTeamInvitations, ...processedOrgInvitations];
    
    // Create response data
    const responseData = { invitations: allInvitations };
    
    // Generate ETag from the response data
    const etag = `W/"${Date.now().toString(36)}"`;
    
    // Cache the response
    responseCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
      etag
    });
    
    console.log(`Found ${processedTeamInvitations.length} team invitations and ${processedOrgInvitations.length} organization invitations for ${normalizedEmail}`);
    
    // Return the response with cache headers
    return createResponse(responseData, 200, {
      'ETag': etag,
      'X-Cache': 'MISS'
    });
    
  } catch (error) {
    console.error('Unexpected error in get_user_invitations:', error);
    return createResponse({
      error: 'Server error',
      details: error.message
    }, 500);
  }
});
