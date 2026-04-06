import React, { useState, useEffect, useRef } from "react";
import { Users, FileText, Upload, Trash2, Search, Download, Settings, ShieldAlert, FilePlus, Lock, KeyRound, Loader2, UserCircle, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// Dashboard principal de l'administration
export default function Admin() {
  const [activeTab, setActiveTab] = useState<"users" | "docs">("users");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({ titre: "", organe: "" });
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const filteredRegistrations = registrations.filter(user => 
    `${user.nom} ${user.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { isAdmin, logout: contextLogout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError("");
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
        
      if (error) {
        setAuthError("Identifiants incorrects ou accès refusé.");
      }
      // Le changement d'état sera géré par AuthContext (onAuthStateChange)
    } catch(err) {
       setAuthError("Erreur de connexion au service d'authentification.");
    } finally {
       setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    contextLogout();
  };

  const fetchData = async () => {
    setIsLoading(true);
    setAuthError("");
    console.log("Tentative de connexion à la base de données...");
    try {
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (regError) throw regError;

      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (catError) throw catError;

      console.log("Données récupérées avec succès:", regData?.length, "inscrits.");
      setRegistrations(regData || []);
      setDocuments(docData || []);
      setCategoriesList(catData || []);
    } catch (error: any) {
      console.error("Erreur critique de connexion:", error);
      setAuthError("Impossible de contacter la base de données: " + (error.message || "Erreur inconnue"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const handleDeleteReg = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet inscrit ?")) return;
    const { error } = await supabase.from('registrations').delete().eq('id', id);
    if (!error) setRegistrations(registrations.filter(r => r.id !== id));
  };

  const handleDeleteDoc = async (id: string, url: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;
    
    // Extraire le nom du fichier de l'URL
    const fileName = url.split("/").pop();
    
    const { error: dbError } = await supabase.from('documents').delete().eq('id', id);
    if (!dbError) {
      if (fileName) {
         await supabase.storage.from('documents').remove([fileName]);
      }
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newDoc.titre || !newDoc.organe) {
        alert("Veuillez remplir le titre et l'organe avant de choisir le fichier.");
        return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const fileSize = (file.size / (1024 * 1024)).toFixed(1) + " MB";

      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert([{
          titre: newDoc.titre,
          organe: newDoc.organe,
          type: "PDF Protocole",
          taille: fileSize,
          url: data.publicUrl
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      setDocuments([dbData, ...documents]);
      setNewDoc({ titre: "", organe: "" });
      alert("Succès: Le protocole " + dbData.titre + " est en ligne.");
    } catch (err: any) {
      console.error(err);
      alert("Erreur: " + (err.message || "Problème d'upload"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const name = newCategory.trim();
    const { data, error } = await supabase.from('categories').insert([{ name }]).select().single();
    if (!error) {
      setCategoriesList([...categoriesList, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory("");
    } else {
        alert("Erreur: Catégorie peut-être déjà existante.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Voulez-vous supprimer cette thématique de la liste ? (Cela ne supprimera pas les documents associés)")) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) setCategoriesList(categoriesList.filter(c => c.id !== id));
  };

  const exportToCSV = () => {
    if (registrations.length === 0) {
        alert("Aucun inscrit à exporter.");
        return;
    }
    
    // Ajout du BOM UTF-8 pour Excel
    const BOM = "\uFEFF";
    const headers = ["Nom", "Prénom", "Email", "Établissement", "Rôle", "Date"];
    const csvContent = BOM + [
      headers.join(";"),
      ...registrations.map(user => [
        `"${user.nom}"`,
        `"${user.prenom}"`,
        `"${user.email}"`,
        `"${user.etablissement}"`,
        `"${user.role}"`,
        `"${new Date(user.created_at).toLocaleDateString("fr-FR")}"`
      ].join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `liste_inscrits_biopsie.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center w-full min-h-[100dvh] p-4 relative overflow-hidden bg-surface-container-lowest">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <Card className="w-full max-w-md p-8 glass-panel border-white/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] rounded-[2.5rem] z-10 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight">Accès Restreint</h2>
            <p className="text-on-surface-variant text-sm mt-2 max-w-[30ch]">Espace sécurisé pour l'administration de la plateforme Biopsie.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/70 ml-1">Email Administrateur</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
                <Input 
                  type="email" 
                  placeholder="admin@biopsie.fr" 
                  className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl transition-all focus:ring-2 focus:ring-primary/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/70 ml-1">Mot de passe</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl transition-all focus:ring-2 focus:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            {authError && <p className="text-error text-xs font-bold px-1 bg-error/5 py-2 rounded-lg border border-error/10">{authError}</p>}
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl text-md font-black shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform" 
              disabled={isAuthenticating}
            >
              {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Déverrouiller l'accès"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-surface-container-lowest min-h-[100dvh] relative px-4 py-12 md:py-16 mx-auto max-w-7xl animate-in fade-in duration-700">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] uppercase font-black tracking-widest text-primary mb-6 backdrop-blur-md">
            <ShieldAlert className="w-3.5 h-3.5 mr-2" /> Espace Administrateur Sécurisé
          </div>
          <h1 className="text-5xl md:text-7xl font-black font-headline text-on-surface tracking-tighter leading-[0.9]">
            Dashboard de <span className="text-gradient">Gestion</span>
          </h1>
          <p className="text-on-surface-variant mt-4 max-w-[60ch] text-lg leading-relaxed">
            Supervision des inscriptions et administration de la thématique scientifique. 
            Utilisez les outils ci-dessous pour piloter la plateforme.
          </p>
        </div>
        <div className="flex flex-col gap-3 items-end">
          <Button variant="ghost" onClick={handleLogout} className="text-on-surface-variant hover:text-error hover:bg-error/5 rounded-2xl h-12 px-6 font-bold transition-all">
            <Lock className="w-4 h-4 mr-2" /> Déconnexion
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData()} 
            disabled={isLoading}
            className="rounded-2xl border-white/10 glass-panel h-10 px-4 text-on-surface font-bold hover:bg-white/10 transition-all"
          >
            <Loader2 className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
            {isLoading ? "Synchronisation..." : "Rafraîchir"}
          </Button>
        </div>
      </div>

      {authError && activeTab === "users" && (
        <div className="bg-error/5 border border-error/20 p-6 rounded-3xl mb-12 flex items-center gap-6 text-error glass-panel animate-in slide-in-from-top-4 duration-500">
          <ShieldAlert className="w-8 h-8 flex-shrink-0" />
          <div>
            <p className="font-black text-lg">Erreur Système</p>
            <p className="text-sm opacity-80">{authError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchData()} className="ml-auto border-error/20 hover:bg-error/10 text-error rounded-xl font-bold h-10 px-6">Réessayer</Button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: "Inscrits", value: registrations.length, icon: Users },
          { label: "Documents", value: documents.length, icon: FileText },
          { label: "Thématiques", value: categoriesList.length, icon: Settings },
          { label: "Statut", value: isLoading ? "..." : "Online", icon: ShieldAlert, spin: isLoading }
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Card className="p-7 glass-panel border-white/10 flex items-center gap-6 group overflow-hidden relative cursor-default">
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-500">
                <stat.icon className="w-32 h-32 rotate-12" />
              </div>
              <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                <stat.icon className={`w-6 h-6 ${stat.spin ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold tracking-[0.2em] text-on-surface-variant/50 mb-1">{stat.label}</p>
                <h4 className="text-4xl font-black text-on-surface tracking-tight leading-none">{stat.value}</h4>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-white/5 mb-12 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: "users", label: "Liste des Inscrits", icon: Users, count: registrations.length },
          { id: "docs", label: "Gestion Thématique", icon: FileText, count: documents.length }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`group relative flex items-center px-8 py-5 font-black text-sm uppercase tracking-widest transition-all whitespace-nowrap rounded-t-2xl ${
              activeTab === tab.id ? "text-primary" : "text-on-surface-variant/60 hover:text-on-surface hover:bg-white/5"
            }`}
          >
            <tab.icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${activeTab === tab.id ? "text-primary" : "text-on-surface-variant/40"}`} /> 
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-3 py-0.5 px-3 rounded-full text-[10px] font-black border ${
                activeTab === tab.id ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/10 text-on-surface-variant"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TABS CONTENT */}
      <AnimatePresence mode="wait">
        {activeTab === "users" && (
          <motion.div 
            key="users-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="relative w-full sm:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Rechercher par nom, rôle..." 
                  className="pl-12 bg-white/5 border-white/10 h-12 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto h-12 rounded-2xl border-white/10 hover:bg-white/5 font-bold px-8">
                <Download className="w-4 h-4 mr-2" /> Exporter .CSV
              </Button>
            </div>

            <Card className="glass-panel border border-white/5 overflow-hidden rounded-[2rem] shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-on-surface-variant/70 text-[10px] uppercase font-black tracking-[0.2em] border-b border-white/5">
                      <th className="p-6 font-black">Identité & Rôle</th>
                      <th className="p-6 font-black">Coordonnées</th>
                      <th className="p-6 font-black">Établissement</th>
                      <th className="p-6 font-black">Inscription</th>
                      <th className="p-6 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="p-20 text-center">
                          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto opacity-50" />
                        </td>
                      </tr>
                    ) : filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-20 text-center text-on-surface-variant">
                          <div className="max-w-xs mx-auto">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p className="font-bold text-lg">{searchTerm ? "Aucun match" : "Liste vide"}</p>
                            <p className="text-sm opacity-60 mt-1">{searchTerm ? "Essayez d'autres mots-clés." : "Les nouveaux inscrits apparaîtront ici."}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((user, idx) => (
                        <motion.tr 
                          key={user.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03, type: "spring", stiffness: 300, damping: 30 }}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="p-6">
                            <div className="font-black text-on-surface text-lg tracking-tight group-hover:text-primary transition-colors">{user.nom} {user.prenom}</div>
                            <div className="inline-flex items-center mt-1 bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border border-primary/10">
                              {user.role}
                            </div>
                          </td>
                          <td className="p-6 text-on-surface-variant/80 font-medium">{user.email}</td>
                          <td className="p-6 text-on-surface-variant/80 font-medium">{user.etablissement}</td>
                          <td className="p-6 text-on-surface-variant/60 font-mono text-xs">{new Date(user.created_at).toLocaleDateString("fr-FR")}</td>
                          <td className="p-6 text-right">
                            <Button onClick={() => handleDeleteReg(user.id)} variant="ghost" size="icon" className="text-on-surface-variant/30 hover:text-error hover:bg-error/10 rounded-xl transition-all">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "docs" && (
          <motion.div 
            key="docs-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex flex-col gap-10"
          >
            <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
              <div className="w-full lg:w-1/3 flex flex-col gap-6">
                 {/* Category Management Card */}
                 <Card className="glass-panel border border-white/5 p-8 rounded-[2rem] shadow-xl flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-2xl">
                        <Settings className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-black text-xl text-on-surface tracking-tight">Thématiques</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {categoriesList.map(cat => (
                            <div key={cat.id} className="group flex items-center bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:border-error/20 hover:text-error transition-all cursor-default">
                                {cat.name}
                                <button onClick={() => handleDeleteCategory(cat.id)} className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 mt-2">
                        <Input 
                            placeholder="NOUVEL ORGANE..." 
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value.toUpperCase())}
                            className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-black tracking-widest px-6"
                        />
                        <Button onClick={handleAddCategory} size="sm" className="h-12 w-12 p-0 rounded-xl shadow-lg shadow-primary/10 transition-transform active:scale-90"><Plus className="w-6 h-6" /></Button>
                    </div>
                 </Card>
              </div>

              {/* Form Card for New Document */}
              <Card className="flex-1 w-full glass-panel border-l-4 border-l-primary border-t border-r border-b border-white/5 p-8 rounded-[2rem] shadow-2xl flex flex-col gap-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <FilePlus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-on-surface tracking-tight">Bibliothèque Scientifique</h3>
                    <p className="text-on-surface-variant text-sm font-medium">Ajoutez de nouveaux protocoles et ressources</p>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-on-surface-variant/70 ml-1">Titre de la ressource</label>
                        <Input 
                            placeholder="ex: Protocole de Biopsie..." 
                            value={newDoc.titre}
                            onChange={(e) => setNewDoc({...newDoc, titre: e.target.value})}
                            className="bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-2 focus:ring-primary/20 px-6 font-bold text-lg tracking-tight"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-on-surface-variant/70 ml-1">Classification Organe</label>
                        <div className="relative">
                          <select 
                              value={newDoc.organe}
                              onChange={(e) => setNewDoc({...newDoc, organe: e.target.value})}
                              className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-md font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                          >
                              <option value="" className="bg-surface-low">Choisir une thématique</option>
                              {categoriesList.map(cat => (
                                  <option key={cat.id} value={cat.name} className="bg-surface-low">{cat.name}</option>
                              ))}
                          </select>
                          <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 pointer-events-none rotate-90" />
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-4 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${newDoc.titre && newDoc.organe ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-on-surface-variant/20"}`} />
                      <p className="text-sm font-bold text-on-surface-variant">
                        {newDoc.titre && newDoc.organe ? "Formulaire complet" : "Paramètres requis"}
                      </p>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf" 
                        onChange={handleUpload}
                      />
                      <Button 
                          onClick={() => fileInputRef.current?.click()} 
                          disabled={isUploading || !newDoc.titre || !newDoc.organe}
                          className="flex-1 sm:flex-none h-14 px-10 rounded-2xl font-black text-md shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                      >
                          {isUploading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Upload className="w-5 h-5 mr-3" />}
                          PUBLIER LE PDF
                      </Button>
                    </div>
                </div>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {documents.length === 0 && !isUploading && (
                  <div className="col-span-full py-32 text-center glass-panel rounded-[3rem] border-2 border-dashed border-white/5">
                      <FileText className="w-16 h-16 mx-auto mb-6 opacity-5" />
                      <p className="text-on-surface-variant font-black text-xl tracking-tight opacity-50">Aucune ressource disponible</p>
                  </div>
              )}

              {documents.map((doc, idx) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Card className="group glass-panel border border-white/5 p-8 rounded-[2.5rem] flex flex-col h-full hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-4 bg-primary/5 text-primary rounded-[1.25rem] group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        <FileText className="w-7 h-7" />
                      </div>
                      <span className="bg-white/5 border border-white/10 text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest text-on-surface-variant group-hover:text-primary group-hover:border-primary/20 transition-all">
                        {doc.organe}
                      </span>
                    </div>
                    <h3 className="font-black text-on-surface text-xl mb-4 line-clamp-2 leading-tight tracking-tight group-hover:text-primary transition-colors">{doc.titre}</h3>
                    <div className="flex items-center justify-between mt-auto pt-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                      <span className="flex items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">{doc.taille}</span>
                      <span className="font-mono">{new Date(doc.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/5">
                       <Button asChild className="flex-1 h-12 rounded-2xl shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all">
                           <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center font-black text-xs uppercase tracking-widest">
                               <Download className="w-4 h-4 mr-2"/> Ouvrir
                           </a>
                       </Button>
                       <Button onClick={() => handleDeleteDoc(doc.id, doc.url)} variant="outline" size="icon" className="w-12 h-12 text-on-surface-variant/30 hover:text-error hover:bg-error/10 border-white/5 rounded-2xl transition-all"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
