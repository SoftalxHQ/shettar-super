"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";

export default function EditProfilePage() {
  const { admin, updateAdmin } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: admin?.first_name || "",
    last_name: admin?.last_name || "",
    other_name: admin?.other_name || "",
    phone_number: admin?.phone_number || "",
    address: admin?.address || "",
    zip_code: admin?.zip_code || "",
    gender: admin?.gender || "",
    date_of_birth: admin?.date_of_birth || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: any = await api.patch("/admin_details", {
        admin: formData
      }, { requiresAuth: true });

      if (response.status?.code === 200) {
        toast.success("Profile Updated", {
          description: "Your administrative profile has been successfully updated."
        });
        
        // Update context with new data without changing the session token or redirecting to /dashboard
        updateAdmin(response.data);
        
        router.push("/dashboard/profile");
      }
    } catch (error: any) {
      toast.error("Update Failed", {
        description: error.message || "An error occurred while updating your profile."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/profile"
          className="p-3 bg-white dark:bg-zinc-900 border border-border rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-black italic uppercase">Update <span className="text-primary">Profile</span></h1>
          <p className="text-sm text-muted-foreground">Modify your administrative identification details.</p>
        </div>
      </div>

      <div className="glass p-8 rounded-[2.5rem] shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 pb-6 border-b border-border/50">
            <div className="relative group">
              <div className="w-24 h-24 bg-primary/10 rounded-3xl border-4 border-white dark:border-zinc-900 shadow-xl flex items-center justify-center overflow-hidden">
                {admin?.avatar_url ? (
                  <img src={admin.avatar_url} alt={admin.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-primary">
                    {admin?.first_name?.[0] || admin?.email?.[0]?.toUpperCase() || "A"}
                  </span>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input type="file" className="hidden" accept="image/*" />
              </label>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Identity Visual Node</p>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold border-l-4 border-primary pl-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">First Name</label>
                <input 
                  type="text" 
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Last Name</label>
                <input 
                  type="text" 
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Other Name</label>
                <input 
                  type="text" 
                  value={formData.other_name}
                  onChange={(e) => setFormData({ ...formData, other_name: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Gender</label>
                <select 
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold border-l-4 border-indigo-500 pl-3">Contact & Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
              <div className="space-y-2 opacity-60">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Administrative Email</label>
                <input 
                  type="email" 
                  value={admin?.email}
                  disabled
                  className="w-full px-5 py-4 bg-slate-100 dark:bg-zinc-900 border border-border/50 rounded-2xl outline-none cursor-not-allowed font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Residential Address</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Zip Code</label>
                <input 
                  type="text" 
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-zinc-800/50 border border-border/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="pt-8 flex items-center justify-end gap-4 border-t border-border/50">
            <Link 
              href="/dashboard/profile"
              className="px-6 py-4 text-sm font-bold text-muted-foreground hover:text-black dark:hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                "Commit Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
