import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TravelStats {
  ridesCreated: number;
  ridesJoined: number;
  totalTrips: number;
  completedTrips: number;
  activeTrips: number;
  cancelledTrips: number;
  loading: boolean;
}

export function useTravelStats(userId: string): TravelStats {
  const [stats, setStats] = useState<TravelStats>({
    ridesCreated: 0,
    ridesJoined: 0,
    totalTrips: 0,
    completedTrips: 0,
    activeTrips: 0,
    cancelledTrips: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchTravelStats = async () => {
      if (!userId) {
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
    
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("userId", "==", userId)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);


        const createdRidesQuery = query(
          collection(db, "Rides"),
          where("userId", "==", userId)
        );
        const createdRidesSnapshot = await getDocs(createdRidesQuery);

     
        let joinedActive = 0;
        let joinedCompleted = 0;
        let joinedCancelled = 0;

        bookingsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const status = data.status || 'active';
          
          switch (status.toLowerCase()) {
            case 'completed':
              joinedCompleted++;
              break;
            case 'cancelled':
            case 'left':
              joinedCancelled++;
              break;
            case 'active':
            default:
              joinedActive++;
              break;
          }
        });

   
        let createdActive = 0;
        let createdCompleted = 0;
        let createdCancelled = 0;

        createdRidesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const status = data.status || 'active';
          
          switch (status.toLowerCase()) {
            case 'completed':
              createdCompleted++;
              break;
            case 'cancelled':
              createdCancelled++;
              break;
            case 'active':
            default:
              createdActive++;
              break;
          }
        });

        const ridesCreated = createdRidesSnapshot.docs.length;
        const ridesJoined = bookingsSnapshot.docs.length;

        setStats({
          ridesCreated,
          ridesJoined,
          totalTrips: ridesCreated + ridesJoined,
          completedTrips: createdCompleted + joinedCompleted,
          activeTrips: createdActive + joinedActive,
          cancelledTrips: createdCancelled + joinedCancelled,
          loading: false,
        });

      } catch (error) {
        console.error("Error fetching travel stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchTravelStats();
  }, [userId]);

  return stats;
}
