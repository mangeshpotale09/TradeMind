
-- ========================================================
-- 1. CLEANUP: Reset all existing policies to clear recursion loops
-- ========================================================
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ========================================================
-- 2. SCHEMA: Ensure all required tables exist
-- ========================================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- 3. THE FIX: Non-Recursive Admin Check Function
-- ========================================================
-- SECURITY DEFINER: This is CRITICAL. It runs the function as the DB owner,
-- which bypasses RLS on the profiles table, preventing the "Infinite Recursion" loop.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========================================================
-- 4. ENABLE RLS & APPLY CLEAN POLICIES
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES Policies
CREATE POLICY "profiles_self_access" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_admin_access" ON public.profiles FOR ALL USING (public.check_is_admin());

-- REGISTRATION Policies
CREATE POLICY "reg_owner" ON public.registration_details FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "reg_admin" ON public.registration_details FOR ALL USING (public.check_is_admin());
CREATE POLICY "reg_public_insert" ON public.registration_details FOR INSERT WITH CHECK (true);

-- TRADES Policies
CREATE POLICY "trades_owner" ON public.trades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "trades_admin" ON public.trades FOR ALL USING (public.check_is_admin());

-- STRATEGIES Policies
CREATE POLICY "strategies_owner" ON public.strategies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "strategies_admin" ON public.strategies FOR ALL USING (public.check_is_admin());

-- RISK Policies
CREATE POLICY "risk_owner" ON public.risk_management FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "risk_admin" ON public.risk_management FOR ALL USING (public.check_is_admin());

-- LOGS Policies
CREATE POLICY "logs_admin" ON public.admin_logs FOR ALL USING (public.check_is_admin());

-- ========================================================
-- 5. TARGETED ADMIN PROMOTION: mangeshpotale09@gmail.com
-- ========================================================
-- This ensures that your specific login is immediately granted full permissions.

UPDATE public.profiles 
SET role = 'ADMIN', status = 'ACTIVE' 
WHERE email = 'mangeshpotale09@gmail.com';

-- Ensure registration metadata exists so the app UI proceeds to the Admin Dashboard
INSERT INTO public.registration_details (user_id, mobile, trading_experience, preferred_market, capital_size)
SELECT id, '9999999999', 'Expert', 'Multi-Asset', 'Master'
FROM public.profiles 
WHERE email = 'mangeshpotale09@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
