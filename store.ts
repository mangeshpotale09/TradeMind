
import { supabase } from './supabase';
import { User, Trade, Strategy, UserRole, UserStatus } from './types';

export const useStore = () => {
  // Profiles (Users)
  const getProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error("Supabase Profile Fetch Error:", profileError);
        const msg = (profileError.message || '').toLowerCase();
        
        // Catch various ways Postgres or the Fetch API reports recursion or connection issues
        if (msg.includes('recursion') || msg.includes('infinite loop') || msg.includes('policy')) {
          throw new Error("RECURSION_ERROR");
        }
        if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
          throw new Error("CONNECTION_ERROR");
        }
        return null;
      }
      
      if (!profile) return null;

      const { data: reg, error: regError } = await supabase
        .from('registration_details')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (regError) console.warn("Registration Details fetch failed:", regError.message);

      return {
        ...profile,
        registration_details: reg ? {
          mobile: reg.mobile,
          tradingExperience: reg.trading_experience,
          preferredMarket: reg.preferred_market,
          capitalSize: reg.capital_size
        } : undefined
      } as User;
    } catch (e: any) {
      if (e.message === "RECURSION_ERROR") throw e;
      if (e.message === "CONNECTION_ERROR" || (e.name === 'TypeError' && e.message === 'Failed to fetch')) {
        throw new Error("CONNECTION_ERROR");
      }
      console.error("Critical Exception in getProfile:", e);
      return null;
    }
  };

  const createProfile = async (userId: string, name: string, email: string) => {
    try {
      // Automatic detection for initial admin setup based on email pattern
      const defaultRole = (email.toLowerCase().includes('admin')) ? UserRole.ADMIN : UserRole.USER;
      const defaultStatus = (defaultRole === UserRole.ADMIN) ? UserStatus.ACTIVE : UserStatus.PENDING;
      
      const { data, error } = await supabase.from('profiles').upsert([{
        id: userId,
        name: name,
        email: email,
        role: defaultRole,
        status: defaultStatus,
        updated_at: new Date().toISOString()
      }], { onConflict: 'id' }).select().maybeSingle();
      
      if (error) {
        const msg = error.message?.toLowerCase() || '';
        if (msg.includes('recursion') || msg.includes('infinite loop')) {
          throw new Error("RECURSION_ERROR");
        }
        if (msg.includes('fetch')) throw new Error("CONNECTION_ERROR");
      }
      
      return { data, error };
    } catch (e: any) {
      if (e.message === "RECURSION_ERROR" || e.message === "CONNECTION_ERROR") throw e;
      return { data: null, error: e };
    }
  };

  const getAllProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, registration_details(*)');
      
      if (error) {
        console.error("Error fetching all profiles:", error);
        return [];
      }
      
      return data.map(u => ({
        ...u,
        registration_details: u.registration_details?.[0] ? {
          mobile: u.registration_details[0].mobile,
          tradingExperience: u.registration_details[0].trading_experience,
          preferredMarket: u.registration_details[0].preferred_market,
          capitalSize: u.registration_details[0].capital_size
        } : undefined
      })) as User[];
    } catch (e) {
      return [];
    }
  };

  const updateProfileStatus = async (userId: string, status: UserStatus, adminId: string, reason?: string) => {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);

    if (!profileError) {
      try {
        await supabase.from('admin_logs').insert([{
          user_id: userId,
          admin_id: adminId,
          action: status === UserStatus.ACTIVE ? 'APPROVE' : 'REJECT',
          reason: reason
        }]);
      } catch (e) {
        console.warn("Could not log admin action.");
      }
    }
    
    return { error: profileError };
  };

  const saveRegistrationDetails = async (userId: string, details: any) => {
    const { error } = await supabase.from('registration_details').upsert([{
      user_id: userId,
      mobile: details.mobile,
      trading_experience: details.experience,
      preferred_market: details.market,
      capital_size: details.capital
    }], { onConflict: 'user_id' });
    return { error };
  };

  const submitPaymentProof = async (userId: string, paymentDetails: any) => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        payment_details: paymentDetails,
        status: UserStatus.PENDING 
      })
      .eq('id', userId);
    return { error };
  };

  const getRiskRules = async (userId: string) => {
    const { data, error } = await supabase
      .from('risk_management')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return { data, error };
  };

  const saveRiskRules = async (userId: string, rules: any) => {
    const { error } = await supabase.from('risk_management').upsert([{
      user_id: userId,
      ...rules,
      updated_at: new Date().toISOString()
    }], { onConflict: 'user_id' });
    return { error };
  };

  const getTrades = async (userId: string) => {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    if (error) return [];
    return data.map(t => ({
      id: t.id,
      userId: t.user_id,
      assetType: t.asset_type,
      instrument: t.instrument,
      side: t.side,
      qty: t.qty,
      entryPrice: t.entry_price,
      exitPrice: t.exit_price,
      stopLoss: t.stop_loss,
      target: t.target,
      timestamp: t.timestamp,
      marketType: t.market_type,
      screenshotUrl: t.screenshot_url,
      notes: t.notes,
      mistakes: t.mistakes || [],
      psychology: t.psychology || {
        emotionBefore: 'CALM',
        emotionDuring: 'CALM',
        emotionAfter: 'CALM',
        confidence: 3,
        stress: 1
      },
      strategyId: t.strategy_id,
      riskReward: t.risk_reward || 0
    })) as Trade[];
  };

  const saveTrade = async (trade: Partial<Trade>) => {
    const { data, error } = await supabase
      .from('trades')
      .insert([{
        user_id: trade.userId,
        asset_type: trade.assetType,
        instrument: trade.instrument,
        side: trade.side,
        qty: trade.qty,
        entry_price: trade.entryPrice,
        exit_price: trade.exitPrice,
        stop_loss: trade.stopLoss,
        target: trade.target,
        risk_reward: trade.riskReward,
        timestamp: trade.timestamp,
        market_type: trade.marketType,
        notes: trade.notes,
        mistakes: trade.mistakes,
        psychology: trade.psychology,
        strategy_id: trade.strategyId,
        screenshot_url: trade.screenshotUrl
      }]);
    return { data, error };
  };

  const getStrategies = async (userId: string) => {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', userId);
    if (error) return [];
    return data.map(s => ({
      id: s.id,
      userId: s.user_id,
      name: s.name,
      entryRules: s.entry_rules,
      exitRules: s.exit_rules,
      timeframe: s.timeframe,
      instrument: s.instrument,
      riskRules: s.risk_rules
    })) as Strategy[];
  };

  const saveStrategy = async (strategy: Partial<Strategy>) => {
    const { data, error } = await supabase
      .from('strategies')
      .insert([{
        user_id: strategy.userId,
        name: strategy.name,
        entry_rules: strategy.entryRules,
        exit_rules: strategy.exitRules,
        timeframe: strategy.timeframe,
        instrument: strategy.instrument,
        risk_rules: strategy.riskRules
      }]);
    return { data, error };
  };

  const deleteStrategy = async (id: string) => {
    const { error } = await supabase
      .from('strategies')
      .delete()
      .eq('id', id);
    return { error };
  };

  return {
    getProfile,
    createProfile,
    getAllProfiles,
    updateProfileStatus,
    saveRegistrationDetails,
    submitPaymentProof,
    getRiskRules,
    saveRiskRules,
    getTrades,
    saveTrade,
    getStrategies,
    saveStrategy,
    deleteStrategy
  };
};
