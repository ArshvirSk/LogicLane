import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  async function signup(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name
    await updateProfile(result.user, {
      displayName: displayName,
    });

    // Create user profile in Firestore
    await createUserProfile(result.user, { displayName });

    return result;
  }

  // Sign in with email and password
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Sign in with Google
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");

    const result = await signInWithPopup(auth, provider);

    // Check if user profile exists, create if not
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    if (!userDoc.exists()) {
      await createUserProfile(result.user);
    }

    return result;
  }

  // Sign out
  function logout() {
    return signOut(auth);
  }

  // Reset password
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Update password
  function updateUserPassword(newPassword) {
    return updatePassword(currentUser, newPassword);
  }

  // Create user profile in Firestore
  async function createUserProfile(user, additionalData = {}) {
    try {
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName:
          user.displayName || additionalData.displayName || "Anonymous User",
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        preferences: {
          defaultStartLocation: "",
          notifications: true,
          theme: "light",
          units: "metric",
        },
        savedLocations: {
          home: "",
          work: "",
          favorite: ""
        },
        stats: {
          totalTrips: 0,
          totalDistanceTraveled: 0,
          totalTimeSaved: 0,
          avgCongestionLevel: 0,
        },
        favoriteRoutes: [],
        recentSearches: [],
        ...additionalData,
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
      setUserProfile(userProfile);
      return userProfile;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error creating user profile:", error);
      }
      throw error;
    }
  }

  // Update user profile
  async function updateUserProfile(updates) {
    try {
      if (!currentUser) throw new Error("No user logged in");

      const updatedData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "users", currentUser.uid), updatedData);

      // Update local state
      setUserProfile((prev) => ({
        ...prev,
        ...updates,
      }));

      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error updating user profile:", error);
      }
      throw error;
    }
  }

  // Get user profile
  async function getUserProfile(uid = null) {
    try {
      const userId = uid || currentUser?.uid;
      if (!userId) return null;

      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const profile = userDoc.data();
        if (!uid) setUserProfile(profile); // Only update state if getting current user
        return profile;
      }
      return null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error getting user profile:", error);
      }
      return null;
    }
  }

  // Save user trip
  async function saveUserTrip(tripData) {
    try {
      if (!currentUser) return null;

      const trip = {
        userId: currentUser.uid,
        ...tripData,
        timestamp: serverTimestamp(),
      };

      const tripRef = await addDoc(collection(db, "trips"), trip);

      // Update user stats
      const currentStats = userProfile?.stats || {};
      await updateUserProfile({
        stats: {
          totalTrips: (currentStats.totalTrips || 0) + 1,
          totalDistanceTraveled:
            (currentStats.totalDistanceTraveled || 0) +
            (tripData.distance || 0),
          totalTimeSaved:
            (currentStats.totalTimeSaved || 0) + (tripData.timeSaved || 0),
          avgCongestionLevel:
            tripData.avgCongestion || currentStats.avgCongestionLevel,
        },
      });

      return tripRef.id;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error saving trip:", error);
      }
      throw error;
    }
  }

  // Get user trips
  async function getUserTrips(limit = 10) {
    try {
      if (!currentUser) return [];

      const q = query(
        collection(db, "trips"),
        where("userId", "==", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const trips = [];
      querySnapshot.forEach((doc) => {
        trips.push({ id: doc.id, ...doc.data() });
      });

      return trips
        .sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate())
        .slice(0, limit);
    } catch (error) {
      console.error("Error getting user trips:", error);
      return [];
    }
  }

  // Get user traffic predictions
  async function getUserTrafficPredictions(limit = 10) {
    try {
      if (!currentUser) return [];

      const q = query(
        collection(db, "traffic_predictions"),
        where("userId", "==", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const predictions = [];
      querySnapshot.forEach((doc) => {
        predictions.push({ id: doc.id, ...doc.data() });
      });

      return predictions
        .sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate())
        .slice(0, limit);
    } catch (error) {
      console.error("Error getting user traffic predictions:", error);
      return [];
    }
  }

  // Add to favorite routes
  async function addToFavorites(routeData) {
    try {
      if (!currentUser || !userProfile) return false;

      const currentFavorites = userProfile.favoriteRoutes || [];
      const routeId = `${routeData.startLocation}-${routeData.endLocation}`;

      // Check if already exists
      if (currentFavorites.some((fav) => fav.id === routeId)) {
        return false; // Already in favorites
      }

      const newFavorite = {
        id: routeId,
        startLocation: routeData.startLocation,
        endLocation: routeData.endLocation,
        distance: routeData.distance,
        avgDuration: routeData.duration,
        addedAt: new Date().toISOString(),
      };

      const updatedFavorites = [...currentFavorites, newFavorite];
      await updateUserProfile({ favoriteRoutes: updatedFavorites });

      return true;
    } catch (error) {
      console.error("Error adding to favorites:", error);
      throw error;
    }
  }

  // Remove from favorites
  async function removeFromFavorites(routeId) {
    try {
      if (!currentUser || !userProfile) return false;

      const updatedFavorites = (userProfile.favoriteRoutes || []).filter(
        (fav) => fav.id !== routeId
      );

      await updateUserProfile({ favoriteRoutes: updatedFavorites });
      return true;
    } catch (error) {
      console.error("Error removing from favorites:", error);
      throw error;
    }
  }

  // Update recent searches
  async function updateRecentSearches(searchData) {
    try {
      if (!currentUser || !userProfile) return;

      const currentSearches = userProfile.recentSearches || [];
      const searchId = `${searchData.startLocation}-${searchData.endLocation}-${Date.now()}`;

      // Remove duplicate if exists (same start and end location)
      const filteredSearches = currentSearches.filter(
        (search) =>
          !(search.startLocation === searchData.startLocation &&
            search.endLocation === searchData.endLocation)
      );

      // Add to beginning with all search details
      const newSearch = {
        id: searchId,
        startLocation: searchData.startLocation,
        endLocation: searchData.endLocation,
        areaName: searchData.areaName,
        roadName: searchData.roadName,
        weatherConditions: searchData.weatherConditions,
        roadworkActivity: searchData.roadworkActivity,
        searchedAt: new Date().toISOString(),
      };

      const updatedSearches = [newSearch, ...filteredSearches].slice(0, 10); // Keep only last 10

      await updateUserProfile({ recentSearches: updatedSearches });
    } catch (error) {
      console.error("Error updating recent searches:", error);
    }
  }

  // Get user analytics/statistics
  async function getUserAnalytics() {
    try {
      if (!currentUser) return null;

      const trips = await getUserTrips(100); // Get more trips for analysis

      if (trips.length === 0) {
        return {
          totalTrips: 0,
          totalDistance: 0,
          totalTimeSaved: 0,
          avgCongestionLevel: 0,
          mostUsedRoute: null,
          preferredTimeSlot: null,
          monthlyTrends: [],
        };
      }

      // Calculate analytics
      const totalDistance = trips.reduce(
        (sum, trip) => sum + (trip.distance || 0),
        0
      );
      const totalTimeSaved = trips.reduce(
        (sum, trip) => sum + (trip.timeSaved || 0),
        0
      );
      const avgCongestion =
        trips.reduce((sum, trip) => sum + (trip.avgCongestion || 0), 0) /
        trips.length;

      // Find most used route
      const routeFreq = {};
      trips.forEach((trip) => {
        const routeKey = `${trip.startLocation}-${trip.endLocation}`;
        routeFreq[routeKey] = (routeFreq[routeKey] || 0) + 1;
      });
      const mostUsedRoute = Object.keys(routeFreq).reduce(
        (a, b) => (routeFreq[a] > routeFreq[b] ? a : b),
        Object.keys(routeFreq)[0]
      );

      // Find preferred time slot
      const timeSlots = {};
      trips.forEach((trip) => {
        if (trip.timestamp) {
          const hour = trip.timestamp.toDate
            ? trip.timestamp.toDate().getHours()
            : new Date(trip.timestamp).getHours();
          const slot =
            hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
          timeSlots[slot] = (timeSlots[slot] || 0) + 1;
        }
      });
      const preferredTimeSlot = Object.keys(timeSlots).reduce(
        (a, b) => (timeSlots[a] > timeSlots[b] ? a : b),
        "Morning"
      );

      return {
        totalTrips: trips.length,
        totalDistance: Math.round(totalDistance),
        totalTimeSaved: Math.round(totalTimeSaved),
        avgCongestionLevel: Math.round(avgCongestion * 10) / 10,
        mostUsedRoute,
        preferredTimeSlot,
        routeFrequency: routeFreq,
        timeSlotData: timeSlots,
      };
    } catch (error) {
      console.error("Error getting user analytics:", error);
      return null;
    }
  }

  // Delete user account
  async function deleteAccount() {
    try {
      if (!currentUser) throw new Error("No user logged in");

      // Delete user data from Firestore
      await deleteDoc(doc(db, "users", currentUser.uid));

      // Delete authentication account
      await deleteUser(currentUser);

      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Get user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error("Error getting user profile:", error);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    updateUserPassword,
    updateUserProfile,
    getUserProfile,
    saveUserTrip,
    getUserTrips,
    getUserTrafficPredictions,
    getUserAnalytics,
    addToFavorites,
    removeFromFavorites,
    updateRecentSearches,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
