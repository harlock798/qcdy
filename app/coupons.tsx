import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Tag } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Spacing, FontSize, Radius } from '../lib/theme';

export type Coupon = {
  id: string;
  code: string | null;
  coupon_type: 'cash' | 'discount' | 'free';
  value: number;
  min_amount: number;
  expires_at: string | null;
  used_at: string | null;
  is_global: boolean;
  description: string | null;
  // Derived
  status: 'valid' | 'used' | 'expired';
};

export function deriveCouponStatus(c: Omit<Coupon, 'status'>): 'valid' | 'used' | 'expired' {
  if (c.used_at) return 'used';
  if (c.expires_at && new Date(c.expires_at) < new Date()) return 'expired';
  return 'valid';
}

export function hydrateCoupons(rows: Omit<Coupon, 'status'>[]): Coupon[] {
  return rows.map(r => ({ ...r, status: deriveCouponStatus(r) }));
}

const typeLabel: Record<string, string> = { cash: '满减券', discount: '折扣券', free: '免费券' };
const typeColor: Record<string, string> = { cash: '#e8392a', discount: '#f59e0b', free: '#22c55e' };

export function CouponCard({ coupon, colors }: { coupon: Coupon; colors: any }) {
  const isValid = coupon.status === 'valid';
  const valueStr =
    coupon.coupon_type === 'cash' ? `¥${coupon.value}` :
    coupon.coupon_type === 'discount' ? `${coupon.value}折` : '免费';

  return (
    <View style={[styles.card, { backgroundColor: isValid ? colors.bgCard : colors.bgInput, borderColor: colors.border, opacity: isValid ? 1 : 0.55 }]}>
      <View style={[styles.cardLeft, { backgroundColor: typeColor[coupon.coupon_type] }]}>
        <Text style={styles.valueText}>{valueStr}</Text>
        <Text style={styles.typeText}>{typeLabel[coupon.coupon_type]}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.desc, { color: colors.text }]}>{coupon.description || typeLabel[coupon.coupon_type]}</Text>
        {coupon.min_amount > 0 && (
          <Text style={[styles.minText, { color: colors.textMuted }]}>满¥{coupon.min_amount}可用</Text>
        )}
        {coupon.expires_at && (
          <Text style={[styles.expText, { color: colors.textMuted }]}>
            有效期至 {new Date(coupon.expires_at).toLocaleDateString('zh-CN')}
          </Text>
        )}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: isValid ? 'rgba(34,197,94,0.15)' : 'rgba(128,128,128,0.15)' }]}>
        <Text style={[styles.statusText, { color: isValid ? '#22c55e' : colors.textMuted }]}>
          {coupon.status === 'valid' ? '可使用' : coupon.status === 'used' ? '已使用' : '已过期'}
        </Text>
      </View>
    </View>
  );
}

export default function CouponsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { session } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filter, setFilter] = useState<'valid' | 'used' | 'expired'>('valid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    supabase
      .from('coupons')
      .select('*')
      .or(`user_id.eq.${session.user.id},is_global.eq.true`)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setCoupons(hydrateCoupons(data as Omit<Coupon, 'status'>[]));
        setLoading(false);
      });
  }, [session]);

  const filtered = coupons.filter(c => c.status === filter);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>优惠券</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['valid', 'used', 'expired'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, filter === t && { borderBottomColor: colors.primary }]}
            onPress={() => setFilter(t)}
          >
            <Text style={[styles.tabText, { color: filter === t ? colors.primary : colors.textSecondary }]}>
              {t === 'valid' ? '可使用' : t === 'used' ? '已使用' : '已过期'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <CouponCard coupon={item} colors={colors} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Tag size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>暂无优惠券</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: 10, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: FontSize.base, fontWeight: '600' },
  list: { padding: Spacing.lg, gap: 12, paddingBottom: 100 },
  card: { flexDirection: 'row', borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden', alignItems: 'center' },
  cardLeft: { width: 88, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  valueText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  typeText: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.xs, marginTop: 2 },
  cardRight: { flex: 1, padding: 14, gap: 4 },
  desc: { fontSize: FontSize.base, fontWeight: '600' },
  minText: { fontSize: FontSize.xs },
  expText: { fontSize: FontSize.xs },
  statusBadge: { alignSelf: 'center', marginRight: 14, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText: { fontSize: FontSize.base },
});