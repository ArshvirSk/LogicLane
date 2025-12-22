import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { useAuth } from "../services/AuthContext";
import ProfileImage from "./ProfileImage";

const UserProfile = () => {
  const {
    currentUser,
    userProfile,
    logout,
    getUserTrips,
    getUserAnalytics,
    updateUserProfile,
  } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [recentTrips, setRecentTrips] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileForm, setProfileForm] = useState({
    displayName: "",
  });

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        displayName: userProfile.displayName || "",
      });
    }
  }, [userProfile]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const trips = await getUserTrips(5);
        setRecentTrips(trips);

        const analyticsData = await getUserAnalytics();
        setAnalytics(analyticsData);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    if (currentUser && userProfile) {
      loadUserData();
    }
  }, [currentUser, userProfile, getUserTrips, getUserAnalytics]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await updateUserProfile({
        displayName: profileForm.displayName,
      });

      setMessage("Profile updated successfully!");
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordForm.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordForm.newPassword);

      setMessage("Password updated successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else if (error.code === "auth/weak-password") {
        setError("New password is too weak.");
      } else {
        setError("Failed to update password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "Unknown";
    return timestamp.toDate().toLocaleDateString();
  };

  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ProfileImage
                src={currentUser.photoURL}
                alt="Profile"
                size="h-16 w-16"
                fallbackText={
                  userProfile.displayName?.charAt(0)?.toUpperCase() ||
                  currentUser.email?.charAt(0)?.toUpperCase() ||
                  "U"
                }
                className="mr-4"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {userProfile.displayName || "Anonymous User"}
                </h1>
                <p className="text-gray-600">{currentUser.email}</p>
                <p className="text-gray-500 text-sm">
                  Member since{" "}
                  {userProfile.createdAt
                    ? formatDate(userProfile.createdAt)
                    : "Recently"}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setEditMode(!editMode)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editMode ? "Cancel" : "Edit Profile"}
              </button>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Settings - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Messages */}
            {message && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {message}
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Profile Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Profile Settings
              </h2>

              <form onSubmit={handleProfileSubmit}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.displayName}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          displayName: e.target.value,
                        })
                      }
                      disabled={!editMode}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 dark:text-white"
                    />
                  </div>

                  {editMode && (
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Password Change Form */}
            {showPasswordForm && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Change Password
                </h2>

                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Updating..." : "Update Password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(false)}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* User Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Trips</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analytics?.totalTrips ||
                      userProfile?.stats?.totalTrips ||
                      0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Distance Traveled</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analytics?.totalDistance ||
                      userProfile?.stats?.totalDistance ||
                      0}{" "}
                    km
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Time Saved</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analytics?.totalTimeSaved ||
                      userProfile?.stats?.totalTimeSaved ||
                      0}{" "}
                    min
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Avg Congestion</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analytics?.avgCongestionLevel ||
                      userProfile?.stats?.avgCongestionLevel ||
                      0}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentTrips && recentTrips.length > 0 ? (
                  recentTrips.slice(0, 3).map((trip) => (
                    <div
                      key={trip.id}
                      className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {trip.startLocation} → {trip.endLocation}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {trip.createdAt
                              ? formatDate(trip.createdAt)
                              : "Unknown"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {trip.distance || 0} km
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {trip.duration || 0} min
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
                )}
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Account Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={logout}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
