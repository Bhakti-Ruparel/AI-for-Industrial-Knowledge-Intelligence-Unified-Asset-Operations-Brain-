"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Shield, Database, Palette, Globe } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account, integrations, and platform preferences.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Profile Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                  <Input defaultValue="Admin User" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input defaultValue="admin@cosmoscnc.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Role</label>
                  <Input defaultValue="Administrator" disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Organization</label>
                  <Input defaultValue="Cosmos CNC" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" /> Notification Preferences</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Equipment Alerts", "Maintenance Reminders", "New Leads", "Compliance Deadlines", "AI Insights"].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <span className="text-sm">{item}</span>
                    <Badge variant="secondary" className="text-[10px]">Enabled</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4 space-y-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" /> Connected Services</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Flask Backend", endpoint: "http://localhost:5001", status: "connected" },
                  { name: "Supabase", endpoint: "Not configured", status: "disconnected" },
                  { name: "WhatsApp (Meta)", endpoint: "Optional", status: "disconnected" },
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.endpoint}</p>
                    </div>
                    <Badge variant={service.status === "connected" ? "default" : "outline"} className="text-[10px]">
                      {service.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4 space-y-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> Theme</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border-2 border-primary p-4 text-center cursor-pointer">
                  <div className="mx-auto h-8 w-8 rounded-full bg-[#0B1120] border border-border" />
                  <p className="mt-2 text-xs font-medium">Dark</p>
                </div>
                <div className="flex-1 rounded-lg border border-border p-4 text-center cursor-pointer opacity-50">
                  <div className="mx-auto h-8 w-8 rounded-full bg-white border border-gray-200" />
                  <p className="mt-2 text-xs font-medium">Light</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
