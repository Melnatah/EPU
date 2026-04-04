import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { motion } from "motion/react";
import { Loader2, User, Save } from "lucide-react";

export default function Profile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [etablissement, setEtablissement] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      setNom(user.nom || "");
      setPrenom(user.prenom || "");
      setEtablissement(user.etablissement || "");
    }
  }, [user, navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const { data, error: updateError } = await supabase
        .from("registrations")
        .update({ nom, prenom, etablissement })
        .eq("id", user.id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      
      login(data); // update local context
      setMessage("Profil mis à jour avec succès !");
    } catch (err: any) {
      setError("Erreur lors de la mise à jour : " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col items-center py-12 px-4 w-full bg-surface-container-lowest min-h-[85vh]">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <Card className="bg-surface shadow-2xl border-outline/10">
          <CardHeader className="text-center pb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Mon Profil</CardTitle>
            <CardDescription>Mettez à jour vos informations personnelles.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Prénom</label>
                  <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase">Nom</label>
                  <Input value={nom} onChange={(e) => setNom(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase">Établissement</label>
                <Input value={etablissement} onChange={(e) => setEtablissement(e.target.value)} required />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-on-surface-variant uppercase">Email (Lecture seule)</label>
                 <Input value={user.email} disabled className="bg-surface-container-highest cursor-not-allowed" />
              </div>

              {message && <p className="text-green-600 text-sm font-medium mt-2">{message}</p>}
              {error && <p className="text-error text-sm font-medium mt-2">{error}</p>}
              
              <Button type="submit" disabled={isSaving} className="w-full mt-6">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer les modifications
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
