import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function Tab() {
  const { id: localId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text>Id: {localId}</Text>
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