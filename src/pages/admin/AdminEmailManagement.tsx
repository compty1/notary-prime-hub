import { usePageTitle } from "@/lib/usePageTitle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Users, Inbox } from "lucide-react";
import AdminMailbox from "./AdminMailbox";
import AdminClientEmails from "./AdminClientEmails";

export default function AdminEmailManagement() {
  usePageTitle("Email Management");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-sans text-2xl font-bold text-foreground">Email Management</h1>
        <p className="text-sm text-muted-foreground">Manage your mailbox and client email correspondence</p>
      </div>

      <Tabs defaultValue="mailbox" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="mailbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Mailbox
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Client Emails
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mailbox" className="mt-4">
          <AdminMailbox />
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <AdminClientEmails />
        </TabsContent>
      </Tabs>
    </div>
  );
}
