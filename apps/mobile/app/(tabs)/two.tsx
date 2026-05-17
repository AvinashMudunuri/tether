import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import { apiFetch } from '@/lib/api';

type Task = {
  id: string;
  title: string;
  dueDate: string | null;
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch('/api/v1/tasks');
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setTasks((await res.json()) as Task[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            {item.dueDate ? (
              <Text style={styles.sub}>
                {new Date(item.dueDate).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          !error ? <Text style={styles.empty}>No tasks</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 14, marginTop: 4, opacity: 0.7 },
  error: { color: '#dc2626', marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 24, opacity: 0.6 },
});
