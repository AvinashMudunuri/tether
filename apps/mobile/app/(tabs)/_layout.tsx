import { SymbolView } from 'expo-symbols';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/auth-context';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [session, loading, router]);

  if (loading || !session) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'house.fill',
                android: 'home',
                web: 'home',
              }}
              tintColor={color}
              size={28}
            />
          ),
          headerRight: () => (
            <Pressable
              onPress={() => void signOut()}
              style={{ marginRight: 15 }}
              accessibilityRole="button"
              accessibilityLabel="Sign out">
              <Text style={{ color: Colors[colorScheme ?? 'light'].tint }}>
                Sign out
              </Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'list.bullet',
                android: 'list',
                web: 'list',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
