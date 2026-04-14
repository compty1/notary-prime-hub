import { ServiceAdminDashboard } from "@/components/admin/ServiceAdminDashboard";

export default function AdminContentCreation() {
  return (
    <ServiceAdminDashboard
      serviceType="content_creation"
      title="Content Creation"
      description="Manage blog writing, social media content, and newsletter design requests"
      extraColumns={[
        {
          key: "service_type",
          label: "Service",
          render: (row) => {
            const data = row.intake_data as Record<string, any> | null;
            return data?.service_type || row.service_name || "—";
          },
        },
      ]}
      detailPanel={(request) => {
        const data = request.intake_data as Record<string, any> | null;
        return (
          <div className="space-y-3 text-sm">
            <div><span className="font-medium">Status:</span> {request.status}</div>
            {data && Object.entries(data).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                {String(value)}
              </div>
            ))}
            {request.notes && <div><span className="font-medium">Notes:</span> {request.notes}</div>}
          </div>
        );
      }}
    />
  );
}
