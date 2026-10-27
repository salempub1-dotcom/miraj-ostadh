import 'server-only';
import { getNeonAuth } from './auth';

export async function getTrialGrades() {
  const auth = getNeonAuth();
  const {data:session}=await auth.getSession();
  if(!session?.user) return { authorized:false as const,grades:[],error:'Unauthenticated' };
  const {data:tokenData,error:tokenError}=await auth.token();
  if(tokenError||!tokenData?.token) return {authorized:false as const,grades:[],error:'No verified JWT'};
  const base=process.env.NEON_DATA_API_URL;
  if(!base) return {authorized:false as const,grades:[],error:'Neon Data API is not configured'};
  const response=await fetch(`${base}/grades?select=code,name_ar&order=order_index.asc`,{
    headers:{Authorization:`Bearer ${tokenData.token}`,Accept:'application/json'},
    cache:'no-store',
  });
  if(!response.ok) return {authorized:true as const,grades:[],error:`Data API status ${response.status}`};
  const grades=await response.json() as Array<{code:string;name_ar:string}>;
  return {authorized:true as const,grades,error:null};
}
