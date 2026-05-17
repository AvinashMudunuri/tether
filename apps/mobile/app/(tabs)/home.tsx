import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import { apiFetch } from '@/lib/api';

type DashboardPayload = {
  tasks: { id: string; title: string }[];
  todaysAppointments: unknown[];
  upcomingAppointments: unknown[];
};

export default function HomeScreen() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch('/api/v1/dashboard');
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setData((await res.json()) as DashboardPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    }
  }, []);

  useEffect(() => {
    load().catch(() => {
      /* load sets error state */
    });
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <Text style={styles.title}>Dashboard</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {data ? (
        <>
          <Text style={styles.metric}>Tasks: {data.tasks.length}</Text>
          <Text style={styles.metric}>
            Today appointments: {data.todaysAppointments.length}
          </Text>
          <Text style={styles.metric}>
            Upcoming (7d): {data.upcomingAppointments.length}
          </Text>
        </>
      ) : !error ? (
        <Text>Loading…</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  metric: { fontSize: 16, marginBottom: 8 },
  error: { color: '#dc2626' },
});
