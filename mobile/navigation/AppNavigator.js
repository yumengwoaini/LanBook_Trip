import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// 引入页面组件
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MyTravelsScreen from '../screens/MyTravelsScreen';
import CreateTravelScreen from '../screens/CreateTravelScreen';
import EditTravelScreen from '../screens/EditTravelScreen';
import TravelDetailScreen from '../screens/TravelDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 主标签导航
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyTravels') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1DA1F2',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
          borderBottomColor: '#f0f0f0',
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: '#333',
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: '游记广场',
          headerShown: false
        }} 
      />
      <Tab.Screen 
        name="MyTravels" 
        component={MyTravelsScreen} 
        options={{ 
          title: '我的游记',
          headerShown: false
        }} 
      />
    </Tab.Navigator>
  );
};

// 认证导航栈
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// 主应用导航栈
const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
          borderBottomColor: '#f0f0f0',
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: '#333',
          fontWeight: 'bold',
        },
        headerTintColor: '#1DA1F2',
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TravelDetail"
        component={TravelDetailScreen}
        options={{ title: '游记详情' }}
      />
      <Stack.Screen
        name="CreateTravel"
        component={CreateTravelScreen}
        options={{ title: '发布游记' }}
      />
      <Stack.Screen
        name="EditTravel"
        component={EditTravelScreen}
        options={{ title: '编辑游记' }}
      />
    </Stack.Navigator>
  );
};

// 根导航
const AppNavigator = () => {
  const { authState } = useAuth();
  
  return (
    <NavigationContainer>
      {authState.isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator; 