import { apiCall } from '@/graphql/client';
import { MetricInterval, MetricType } from '@/zeus';
import React from 'react';

const getMetrics = async () => {
  const { metricSummary } = await apiCall('query')({
    metricSummary: [
      { input: { interval: MetricInterval.Daily, types: [MetricType.OrderTotal], refresh: false } },
      { title: true, entries: { label: true, value: true }, interval: true, type: true },
    ],
  });

  return metricSummary;
};

export const Dashboard = () => {
  const [metrics, setMetrics] = React.useState<
    {
      title: string;
      entries: { label: string; value: number }[];
      interval: MetricInterval;
      type: MetricType;
    }[]
  >([]);
  React.useEffect(() => {
    getMetrics().then((data) => {
      setMetrics(data);
    });
  }, []);
  console.log(metrics);
  return <div>Dashboard</div>;
};
