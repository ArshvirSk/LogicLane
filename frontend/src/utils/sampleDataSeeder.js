// Sample data seeder for testing dashboard functionality
import { useAuth } from "../services/AuthContext";

export const useSampleDataSeeder = () => {
  const { saveUserTrip, addToFavorites, updateRecentSearches } = useAuth();

  const sampleTrips = [
    {
      startLocation: "Koramangala",
      endLocation: "Electronic City",
      distance: 12.5,
      duration: 45,
      timeSaved: 15,
      avgCongestion: 6.5,
      weather: "Clear",
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
    },
    {
      startLocation: "Whitefield",
      endLocation: "MG Road",
      distance: 18.2,
      duration: 60,
      timeSaved: 20,
      avgCongestion: 7.2,
      weather: "Rainy",
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
    },
    {
      startLocation: "Jayanagar",
      endLocation: "Brigade Road",
      distance: 8.7,
      duration: 30,
      timeSaved: 10,
      avgCongestion: 4.3,
      weather: "Cloudy",
      timestamp: new Date(Date.now() - 259200000), // 3 days ago
    },
    {
      startLocation: "BTM Layout",
      endLocation: "Indiranagar",
      distance: 15.1,
      duration: 50,
      timeSaved: 18,
      avgCongestion: 5.8,
      weather: "Clear",
      timestamp: new Date(Date.now() - 345600000), // 4 days ago
    },
    {
      startLocation: "Koramangala",
      endLocation: "Electronic City",
      distance: 12.8,
      duration: 42,
      timeSaved: 12,
      avgCongestion: 6.1,
      weather: "Clear",
      timestamp: new Date(Date.now() - 432000000), // 5 days ago
    },
  ];

  const sampleFavorites = [
    {
      startLocation: "Koramangala",
      endLocation: "Electronic City",
      distance: 12.5,
      duration: 45,
    },
    {
      startLocation: "Whitefield",
      endLocation: "MG Road",
      distance: 18.2,
      duration: 60,
    },
  ];

  const seedSampleData = async () => {
    try {
      // Add sample trips
      for (const trip of sampleTrips) {
        await saveUserTrip(trip);

        // Add to recent searches
        await updateRecentSearches({
          startLocation: trip.startLocation,
          endLocation: trip.endLocation,
        });
      }

      // Add sample favorites
      for (const favorite of sampleFavorites) {
        await addToFavorites(favorite);
      }

      console.log("Sample data seeded successfully!");
      return true;
    } catch (error) {
      console.error("Error seeding sample data:", error);
      return false;
    }
  };

  return { seedSampleData };
};
