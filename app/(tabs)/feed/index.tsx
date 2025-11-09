import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function Page() {
    const numbers = Array.from({ length: 5 }, (_, i) => i + 1);

    return (
        <View style={styles.container}>
            {numbers.map((number) => (
                <Link key={number} href={`/feed/${number}`}>
                    <Text>Item {number}</Text>
                </Link>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});