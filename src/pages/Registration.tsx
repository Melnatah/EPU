import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { motion } from "motion/react";

const formSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  residencyYear: z.enum(["DES 1", "DES 2", "DES 3", "DES 4"], {
    message: "Veuillez sélectionner votre niveau",
  }),
  hospital: z.string().min(2, "Veuillez indiquer votre centre hospitalier"),
  email: z.string().email("Email invalide"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Registration() {
  const { login: loginUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const { error } = await supabase.from('registrations').insert([{
        nom: data.lastName,
        prenom: data.firstName,
        email: data.email,
        etablissement: data.hospital,
        role: `Résident (${data.residencyYear})`
      }]);
      
      if (error) throw error;
      
      loginUser(data);
      navigate("/vault");
    } catch (err: any) {
      console.error("Erreur d'inscription:", err);
      alert("Erreur base de données: " + (err.message || err.error_description || "Vérifiez vos clés ou la table SQL"));
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="glass-panel border-outline-variant/20 bg-surface-container-low/80">
          <CardHeader className="text-center pb-6 md:pb-8">
            <CardTitle className="text-2xl md:text-3xl font-extrabold font-headline mb-2 text-on-surface">
              Inscription à l'EPU <span className="text-primary block mt-1">Biopsie Échoguidée</span>
            </CardTitle>
            <CardDescription className="text-sm md:text-base font-light text-on-surface-variant max-w-sm mx-auto mt-2">
              Rejoignez la communauté. Obtenez votre accès exclusif aux Thématiques et préparez-vous pour l'atelier pratique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">Prénom</label>
                  <Input 
                    placeholder="Jean" 
                    {...register("firstName")} 
                    className={errors.firstName ? "ring-2 ring-error/50" : ""}
                  />
                  {errors.firstName && <p className="text-error text-xs mt-1 ml-1">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">Nom</label>
                  <Input 
                    placeholder="Dupont" 
                    {...register("lastName")}
                    className={errors.lastName ? "ring-2 ring-error/50" : ""}
                  />
                  {errors.lastName && <p className="text-error text-xs mt-1 ml-1">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">Résident</label>
                  <select 
                    {...register("residencyYear")}
                    defaultValue=""
                    className="flex h-12 w-full rounded-xl bg-surface-container-lowest px-4 py-2 text-sm text-on-surface ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all appearance-none border-none"
                  >
                    <option value="" disabled>Sélectionner...</option>
                    <option value="DES 1">DES 1</option>
                    <option value="DES 2">DES 2</option>
                    <option value="DES 3">DES 3</option>
                    <option value="DES 4">DES 4</option>
                  </select>
                  {errors.residencyYear && <p className="text-error text-xs mt-1 ml-1">{errors.residencyYear.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">Centre Hospitalier</label>
                  <Input 
                    placeholder="CHU SO" 
                    {...register("hospital")}
                    className={errors.hospital ? "ring-2 ring-error/50" : ""}
                  />
                  {errors.hospital && <p className="text-error text-xs mt-1 ml-1">{errors.hospital.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1">Email Académique</label>
                <Input 
                  type="email" 
                  placeholder="votre.nom@chu-so.tg" 
                  {...register("email")}
                  className={errors.email ? "ring-2 ring-error/50" : ""}
                />
                {errors.email && <p className="text-error text-xs mt-1 ml-1">{errors.email.message}</p>}
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full mt-6 md:mt-8 shadow-xl shadow-primary/10"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Création en cours..." : "Créer mon accès résident"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
