import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Monitor, Plus, LogOut, Shield, FileText, RefreshCw, Video, CheckCircle, Mic, Camera as CameraIcon, Wifi, XCircle, User, Pencil, Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  id_verification: "bg-yellow-100 text-yellow-800",
  kba_pending: "bg-orange-100 text-orange-800",
  in_session: "bg-purple-100 text-purple-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
};

export default function ClientPortal() {
  const { user, signOut, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [techCheckOpen, setTechCheckOpen] = useState(false);
  const [techResults, setTechResults] = useState<{ camera: boolean | null; mic: boolean | null; connection: boolean | null }>({
    camera: null, mic: null, connection: null,
  });
  const [techChecking, setTechChecking] = useState(false);

  // Profile editing
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", address: "", city: "", state: "", zip: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [apptRes, profileRes] = await Promise.all([
        supabase.from("appointments").select("*").eq("client_id", user.id).order("scheduled_date", { ascending: false }),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      ]);
      if (apptRes.data) setAppointments(apptRes.data);
      if (profileRes.data) {
        setProfile(profileRes.data);
        setProfileForm({
          full_name: profileRes.data.full_name || "",
          phone: profileRes.data.phone || "",
          address: profileRes.data.address || "",
          city: profileRes.data.city || "",
          state: profileRes.data.state || "",
          zip: profileRes.data.zip || "",
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const upcoming = appointments.filter((a) => ["scheduled", "confirmed", "id_verification", "kba_pending"].includes(a.status));
  const inSession = appointments.filter((a) => a.status === "in_session");
  const past = appointments.filter((a) => ["completed", "cancelled", "no_show"].includes(a.status));

  const cancelAppointment = async (id: string) => {
    setCancelling(true);
    const { error } = await supabase.from("appointments").update({ status: "cancelled" as any }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Appointment cancelled", description: "Your appointment has been cancelled successfully." });
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: "cancelled" } : a));
    }
    setCancelling(false);
    setCancelDialogId(null);
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profileForm.full_name,
      phone: profileForm.phone || null,
      address: profileForm.address || null,
      city: profileForm.city || null,
      state: profileForm.state || null,
      zip: profileForm.zip || null,
    }).eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
      setProfile({ ...profile, ...profileForm });
      setEditProfileOpen(false);
    }
    setSavingProfile(false);
  };

  const isSessionNear = (appt: any) => {
    const now = new Date();
    const sessionDate = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`);
    const diff = sessionDate.getTime() - now.getTime();
    return diff <= 15 * 60 * 1000 && diff > -60 * 60 * 1000;
  };

  const runTechCheck = async () => {
    setTechChecking(true);
    setTechResults({ camera: null, mic: null, connection: null });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setTechResults((prev) => ({ ...prev, camera: true }));
    } catch { setTechResults((prev) => ({ ...prev, camera: false })); }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setTechResults((prev) => ({ ...prev, mic: true }));
    } catch { setTechResults((prev) => ({ ...prev, mic: false })); }
    setTechResults((prev) => ({ ...prev, connection: navigator.onLine }));
    setTechChecking(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">SG</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">Client Portal</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin"><Button variant="outline" size="sm">Admin Dashboard</Button></Link>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Sign Out</Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
            </h1>
            <p className="text-muted-foreground">Manage your notarization appointments</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditProfileOpen(true)}>
            <Pencil className="mr-1 h-3 w-3" /> Edit Profile
          </Button>
        </motion.div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Upcoming Appointments</h2>
          <Link to="/book">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark">
              <Plus className="mr-1 h-4 w-4" /> New Appointment
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : upcoming.length === 0 && inSession.length === 0 ? (
          <Card className="mb-8 border-border/50">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No upcoming appointments</p>
              <Link to="/book" className="mt-4">
                <Button className="bg-accent text-accent-foreground hover:bg-gold-dark">Book Your First Appointment</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-8 space-y-4">
            {inSession.map((appt) => (
              <Card key={appt.id} className="border-2 border-purple-300 bg-purple-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                        <Video className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{appt.service_type}</p>
                        <p className="text-sm text-muted-foreground">Session in progress</p>
                      </div>
                    </div>
                    <Link to={`/ron-session?id=${appt.id}`}>
                      <Button className="bg-purple-600 text-white hover:bg-purple-700">
                        <Video className="mr-1 h-4 w-4" /> Rejoin Session
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}

            {upcoming.map((appt) => (
              <motion.div key={appt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-border/50 transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                          {appt.notarization_type === "ron" ? <Monitor className="h-5 w-5 text-accent" /> : <MapPin className="h-5 w-5 text-accent" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{appt.service_type}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(appt.scheduled_date)}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(appt.scheduled_time)}</span>
                          </div>
                          {appt.location && appt.location !== "Remote" && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {appt.location}
                            </p>
                          )}
                          {appt.estimated_price && (
                            <p className="mt-1 text-xs text-muted-foreground">Est. ${parseFloat(appt.estimated_price).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {appt.notarization_type === "ron" && isSessionNear(appt) && (
                          <Link to={`/ron-session?id=${appt.id}`}>
                            <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
                              <Video className="mr-1 h-3 w-3" /> Join
                            </Button>
                          </Link>
                        )}
                        {appt.notarization_type === "ron" && !isSessionNear(appt) && (
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => { setTechCheckOpen(true); runTechCheck(); }}>
                            <Wifi className="mr-1 h-3 w-3" /> Tech Check
                          </Button>
                        )}
                        {/* Reschedule */}
                        <Link to={`/book?rebook=${appt.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            <RefreshCw className="mr-1 h-3 w-3" /> Reschedule
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={() => setCancelDialogId(appt.id)}
                        >
                          Cancel
                        </Button>
                        <Badge className={statusColors[appt.status] || "bg-muted text-muted-foreground"}>
                          {appt.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Past with rebook */}
        {past.length > 0 && (
          <>
            <h2 className="mb-4 font-display text-xl font-semibold">Past Appointments</h2>
            <div className="space-y-3">
              {past.map((appt) => (
                <Card key={appt.id} className="border-border/50 opacity-75">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-foreground">{appt.service_type}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(appt.scheduled_date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {appt.status === "completed" && (
                        <Link to={`/book?rebook=${appt.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            <RefreshCw className="mr-1 h-3 w-3" /> Rebook
                          </Button>
                        </Link>
                      )}
                      <Badge className={statusColors[appt.status] || "bg-muted text-muted-foreground"}>
                        {appt.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDialogId} onOpenChange={() => setCancelDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>Are you sure you want to cancel this appointment? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogId(null)}>Keep Appointment</Button>
            <Button variant="destructive" onClick={() => cancelDialogId && cancelAppointment(cancelDialogId)} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Cancel Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <User className="h-5 w-5 text-accent" /> Edit Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="(614) 555-1234" />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>City</Label>
                <Input value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} />
              </div>
              <div>
                <Label>State</Label>
                <Input value={profileForm.state} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} maxLength={2} />
              </div>
              <div>
                <Label>Zip</Label>
                <Input value={profileForm.zip} onChange={(e) => setProfileForm({ ...profileForm, zip: e.target.value })} maxLength={5} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfileOpen(false)}>Cancel</Button>
            <Button onClick={saveProfile} disabled={savingProfile} className="bg-accent text-accent-foreground hover:bg-gold-dark">
              {savingProfile ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              Save Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tech Check Dialog */}
      <Dialog open={techCheckOpen} onOpenChange={setTechCheckOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Pre-Session Tech Check</DialogTitle>
            <DialogDescription>Make sure your equipment is ready for your RON session.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              {techResults.camera === null ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              ) : techResults.camera ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <CameraIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Camera {techResults.camera === true ? "— Working" : techResults.camera === false ? "— Not detected or blocked" : ""}</span>
            </div>
            <div className="flex items-center gap-3">
              {techResults.mic === null ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              ) : techResults.mic ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <Mic className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Microphone {techResults.mic === true ? "— Working" : techResults.mic === false ? "— Not detected or blocked" : ""}</span>
            </div>
            <div className="flex items-center gap-3">
              {techResults.connection === null ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              ) : techResults.connection ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Internet {techResults.connection === true ? "— Connected" : techResults.connection === false ? "— No connection" : ""}</span>
            </div>
          </div>
          {!techChecking && (
            <div className="text-center">
              {techResults.camera && techResults.mic && techResults.connection ? (
                <p className="text-sm text-emerald-600 font-medium">✓ All systems ready for your RON session!</p>
              ) : (
                <p className="text-sm text-amber-600">Some checks failed. Please resolve the issues above before your session.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => runTechCheck()}>Re-run Check</Button>
            <Button onClick={() => setTechCheckOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
