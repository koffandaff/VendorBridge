"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { fetchVendorById, Vendor } from "@/lib/data";

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVendor = async () => {
      try {
        const found = await fetchVendorById(vendorId);
        setVendor(found || null);
      } catch (error) {
        console.error("Failed to fetch vendor", error);
      } finally {
        setLoading(false);
      }
    };
    if (vendorId) loadVendor();
  }, [vendorId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "300px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(255, 255, 255, 0.1)", borderRadius: "50%", borderTopColor: "#10b981", animation: "spin 1s ease-in-out infinite" }}></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div style={{ padding: "40px", color: "#f8fafc" }}>
        <h2>Vendor Not Found</h2>
        <button 
          onClick={() => router.push('/vendors')}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "8px 16px", borderRadius: "8px", marginTop: "16px", cursor: "pointer" }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "#10b981";
      case "Pending": return "#f59e0b";
      case "Blocked": return "#ef4444";
      default: return "#94a3b8";
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "32px", animation: "fadeIn 0.4s ease-out" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button 
            onClick={() => router.push('/vendors')}
            style={{ background: "transparent", border: "none", color: "#94a3b8", padding: "0 0 16px 0", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <ArrowLeft size={16} />
            <span>Back to Vendors</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 800, background: "linear-gradient(to right, #fff, #cbd5e1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {vendor.name}
            </h1>
            <span style={{ 
              background: `${getStatusColor(vendor.status)}20`, 
              color: getStatusColor(vendor.status),
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 600,
              border: `1px solid ${getStatusColor(vendor.status)}40`
            }}>
              {vendor.status}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ background: "rgba(15, 17, 21, 0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "16px", padding: "32px" }}>
            <h3 style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "24px" }}>Contact Information</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "10px", borderRadius: "8px", color: "#f8fafc" }}><User size={20} /></div>
                <div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Contact Person</div>
                  <div style={{ fontSize: "15px", color: "#f8fafc", fontWeight: 500 }}>{vendor.contactPerson || "—"}</div>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "10px", borderRadius: "8px", color: "#f8fafc" }}><Phone size={20} /></div>
                <div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Phone Number</div>
                  <div style={{ fontSize: "15px", color: "#f8fafc", fontWeight: 500 }}>{vendor.contactNo}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "10px", borderRadius: "8px", color: "#f8fafc" }}><Mail size={20} /></div>
                <div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Email Address</div>
                  <div style={{ fontSize: "15px", color: "#f8fafc", fontWeight: 500 }}>{vendor.email || "—"}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "10px", borderRadius: "8px", color: "#f8fafc" }}><MapPin size={20} /></div>
                <div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Registered Address</div>
                  <div style={{ fontSize: "15px", color: "#f8fafc", fontWeight: 500, lineHeight: 1.5 }}>
                    {vendor.address || "Not available"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ background: "rgba(15, 17, 21, 0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "16px", padding: "32px" }}>
            <h3 style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "24px" }}>Business Profile</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "10px", borderRadius: "8px", color: "#f8fafc" }}><Briefcase size={20} /></div>
                <div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Primary Category</div>
                  <div style={{ fontSize: "15px", color: "#f8fafc", fontWeight: 500 }}>{vendor.category}</div>
                </div>
              </div>
              
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", margin: "8px 0" }}></div>

              <div>
                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>GST Registration Number</div>
                <div style={{ fontSize: "16px", color: "#f8fafc", fontWeight: 600, letterSpacing: "1px" }}>{vendor.gstNumber}</div>
              </div>

              <div>
                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Vendor ID</div>
                <div style={{ fontSize: "15px", color: "#94a3b8" }}>{vendor.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
