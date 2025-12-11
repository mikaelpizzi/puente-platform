import React, { useState } from 'react';
import { Truck, MapPin, Package, Navigation, CheckCircle, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import {
  useGetAvailableJobsQuery,
  useAcceptJobMutation,
  useCompleteDeliveryMutation,
} from '../features/logistics/logisticsApi';
import { DeliveryMap } from '../features/logistics/DeliveryMap';
import toast from 'react-hot-toast';

export const LogisticsPage: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const isCourier = user?.role === 'COURIER';

  const {
    data: jobs,
    isLoading,
    refetch,
  } = useGetAvailableJobsQuery(undefined, {
    skip: !isCourier,
    pollingInterval: 30000, // Poll every 30s for new jobs
  });

  const [acceptJob, { isLoading: isAccepting }] = useAcceptJobMutation();
  const [completeDelivery, { isLoading: isCompleting }] = useCompleteDeliveryMutation();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const selectedJob = jobs?.find((j) => j.id === selectedJobId);

  const handleAcceptJob = async (jobId: string) => {
    try {
      await acceptJob(jobId).unwrap();
      toast.success('¡Trabajo aceptado!');
      setSelectedJobId(jobId);
    } catch (error) {
      toast.error('Error al aceptar el trabajo');
    }
  };

  const handleCompleteDelivery = async (jobId: string) => {
    try {
      await completeDelivery(jobId).unwrap();
      toast.success('¡Entrega completada!');
      setSelectedJobId(null);
    } catch (error) {
      toast.error('Error al completar la entrega');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-gray-500">Cargando entregas...</p>
      </div>
    );
  }

  // Courier view with jobs
  if (isCourier) {
    return (
      <div className="pb-24">
        {/* Map Section */}
        <div className="h-72 bg-gray-100 dark:bg-gray-800 relative">
          {selectedJob ? (
            <DeliveryMap
              pickup={selectedJob.pickupLocation}
              dropoff={selectedJob.dropoffLocation}
              className="h-full w-full"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Selecciona un trabajo para ver la ruta</p>
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span>Recoger</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>Entregar</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Truck className="text-emerald-500" />
              Trabajos Disponibles
            </h2>
            <button onClick={() => refetch()} className="text-sm text-emerald-600 hover:underline">
              Actualizar
            </button>
          </div>

          {!jobs || jobs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay trabajos disponibles
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Los nuevos trabajos aparecerán aquí automáticamente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-2 transition-all cursor-pointer ${
                    selectedJobId === job.id
                      ? 'border-emerald-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        job.status === 'available'
                          ? 'bg-blue-100 text-blue-800'
                          : job.status === 'accepted'
                            ? 'bg-yellow-100 text-yellow-800'
                            : job.status === 'in-progress'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {job.status.toUpperCase().replace('-', ' ')}
                    </span>
                    <span className="font-bold text-emerald-600">${job.earnings.toFixed(2)}</span>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{job.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{job.description}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Navigation size={14} className="text-emerald-500" />
                    <span>{job.distance.toFixed(1)} km</span>
                  </div>

                  {job.status === 'available' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptJob(job.id);
                      }}
                      disabled={isAccepting}
                      className="w-full mt-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      {isAccepting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Aceptar Trabajo
                    </button>
                  )}

                  {(job.status === 'accepted' || job.status === 'in-progress') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteDelivery(job.id);
                      }}
                      disabled={isCompleting}
                      className="w-full mt-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      {isCompleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Completar Entrega
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Seller view - show their shipments
  return (
    <div className="p-4 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <Truck className="text-emerald-500 dark:text-emerald-400" />
        Mis Envíos
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sin envíos pendientes
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Cuando tengas órdenes enviadas, aparecerán aquí con su estado de entrega
        </p>
      </div>
    </div>
  );
};
