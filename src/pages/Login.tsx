import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("registrations")
        .select("*")
        .or(`email.ilike.${email},nom.ilike.${email},prenom.ilike.${email}`)
        .limit(1);

      if (fetchError || !data || data.length === 0) {
        setError("Aucun compte trouvé avec cet identifiant.");
      } else {
        login(data[0]);
        navigate("/vault");
      }
    } catch (err: any) {
      setError("Erreur de connexion à la base de données.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-panel border-outline-variant/20 bg-surface-container-low/80">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-extrabold font-headline mb-2 text-on-surface">
              Se Connecter
            </CardTitle>
            <CardDescription>
              Entrez votre nom d'utilisateur (ou adresse email) pour retrouver votre accès.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="text" 
                  placeholder="votre_nom_d_utilisateur ou email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-error text-xs">{error}</p>}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accéder à la Thématique"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
