import React, { useState, useEffect, useRef } from "react";
import { Users, FileText, Upload, Trash2, Search, Download, Settings, ShieldAlert, FilePlus, Lock, KeyRound, Loader2, UserCircle, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/context/AuthContext";

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
      <div className="flex-1 flex flex-col justify-center items-center w-full min-h-[85vh] p-4 relative overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <Card className="w-full max-w-md p-8 bg-surface/80 backdrop-blur-xl border border-outline/20 shadow-2xl rounded-3xl z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-headline text-on-surface">Accès Restreint</h2>
            <p className="text-on-surface-variant text-sm mt-2">Veuillez entrer le mot de passe administrateur pour accéder à ce module.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
              <Input 
                type="email" 
                placeholder="Email administrateur..." 
                className="pl-12 bg-surface-container-low border-outline/10 h-12 rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
              <Input 
                type="password" 
                placeholder="Mot de passe..." 
                className="pl-12 bg-surface-container-low border-outline/10 h-12 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {authError && <p className="text-error text-xs font-bold px-1">{authError}</p>}
            <Button type="submit" className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/20" disabled={isAuthenticating}>
              {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Déverrouiller l'accès"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-surface-container-lowest min-h-[85vh] relative px-4 py-12 md:py-16 mx-auto max-w-7xl animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center justify-between rounded-full border border-error/20 bg-error/10 px-4 py-2 text-sm text-error mb-4 font-medium backdrop-blur-md">
            <div className="flex items-center"><ShieldAlert className="w-4 h-4 mr-2" /> Espace Administrateur Sécurisé</div>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-on-surface tracking-tight">
            Dashboard de <span className="text-primary">Gestion</span>
          </h1>
          <p className="text-on-surface-variant mt-2">Gérez vos inscrits et les ressources de la thématique.</p>
        </div>
        <div className="flex flex-col gap-3 self-start md:self-end items-end">
          <Button variant="ghost" onClick={handleLogout} className="text-on-surface-variant hover:text-error hover:bg-error/10">
            <Lock className="w-4 h-4 mr-2" /> Verrouiller
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchData()} 
            disabled={isLoading}
            className="text-on-surface-variant hover:text-primary"
          >
            <Loader2 className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
            {isLoading ? "Chargement..." : "Rafraîchir les données"}
          </Button>
        </div>
      </div>

      {authError && activeTab === "users" && (
        <div className="bg-error/10 border border-error/20 p-4 rounded-2xl mb-8 flex items-center gap-4 text-error animate-in fade-in slide-in-from-top-2">
          <ShieldAlert className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-bold">Erreur de connexion</p>
            <p className="text-sm opacity-90">{authError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchData()} className="ml-auto border-error/20 hover:bg-error/10 text-error">Ressayer</Button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-surface-container-high border-outline/10 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Inscrits</p>
            <h4 className="text-2xl font-black text-on-surface">{registrations.length}</h4>
          </div>
        </Card>
        <Card className="p-5 bg-surface-container-high border-outline/10 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-secondary/10 text-secondary rounded-2xl"><FileText className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Documents</p>
            <h4 className="text-2xl font-black text-on-surface">{documents.length}</h4>
          </div>
        </Card>
        <Card className="p-5 bg-surface-container-high border-outline/10 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-tertiary/10 text-tertiary rounded-2xl"><Settings className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Thématiques</p>
            <h4 className="text-2xl font-black text-on-surface">{categoriesList.length}</h4>
          </div>
        </Card>
        <Card className="p-5 bg-surface-container-high border-outline/10 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-surface-container-highest text-on-surface-variant rounded-2xl"><Loader2 className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} /></div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Statut</p>
            <h4 className="text-sm font-bold text-on-surface truncate max-w-[120px]">{isLoading ? "Mise à jour..." : "Synchronisé"}</h4>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-outline/20 mb-8 overflow-x-auto">
        <button 
          onClick={() => setActiveTab("users")}
          className={`flex items-center px-6 py-4 font-medium text-sm md:text-base border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "users" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Users className="w-5 h-5 mr-2" /> Liste des Inscrits
          <span className="ml-3 bg-primary/10 text-primary py-0.5 px-2.5 rounded-full text-xs font-bold">{registrations.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab("docs")}
          className={`flex items-center px-6 py-4 font-medium text-sm md:text-base border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "docs" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <FileText className="w-5 h-5 mr-2" /> Gestion Thématique
          <span className="ml-3 bg-primary/10 text-primary py-0.5 px-2.5 rounded-full text-xs font-bold">{documents.length}</span>
        </button>
      </div>

      {/* TABS CONTENT */}
      {activeTab === "users" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
              <Input 
                placeholder="Rechercher un inscrit..." 
                className="pl-10 bg-surface border-outline/20" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto"><Download className="w-4 h-4 mr-2" /> Exporter Excel</Button>
          </div>

          <Card className="bg-surface/50 border-outline/10 backdrop-blur-md overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-sm border-b border-outline/10 uppercase tracking-wider">
                    <th className="p-4 font-medium">Nom & Prénom</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Établissement</th>
                    <th className="p-4 font-medium">Date d'inscription</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                        <div className="flex justify-center items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                      </td>
                    </tr>
                  ) : filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                        {searchTerm ? "Aucun résultat pour cette recherche." : "Aucun inscrit pour le moment."}
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-on-surface">{user.nom} {user.prenom}</div>
                        <div className="text-xs text-primary">{user.role}</div>
                      </td>
                      <td className="p-4 text-on-surface-variant">{user.email}</td>
                      <td className="p-4 text-on-surface-variant">{user.etablissement}</td>
                      <td className="p-4 text-on-surface-variant text-sm">{new Date(user.created_at).toLocaleDateString("fr-FR")}</td>
                      <td className="p-4 text-right">
                        <Button onClick={() => handleDeleteReg(user.id)} variant="ghost" size="icon" className="text-error hover:bg-error/10 hover:text-error"><Trash2 className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "docs" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
             <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
              <Input placeholder="Rechercher un document..." className="pl-10 bg-surface border-outline/20" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf" 
              onChange={handleUpload}
            />
            <Button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading}
                className="w-full sm:w-auto"
            >
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Uploader un PDF
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
             {/* Category Management Card */}
             <Card className="bg-surface border-outline/10 p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Settings className="w-5 h-5 text-secondary" />
                  </div>
                  <h3 className="font-bold text-on-surface">Thématiques (Filtres)</h3>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                    {categoriesList.map(cat => (
                        <div key={cat.id} className="group flex items-center bg-surface-container-high px-3 py-1.5 rounded-full text-xs font-bold text-on-surface-variant hover:bg-error/10 hover:text-error transition-all cursor-default">
                            {cat.name}
                            <button onClick={() => handleDeleteCategory(cat.id)} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-2">
                    <Input 
                        placeholder="Nouveau: SEIN, REIN..." 
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value.toUpperCase())}
                        className="bg-surface-container-low border-outline/10 h-10 text-xs"
                    />
                    <Button onClick={handleAddCategory} size="sm" className="h-10 px-4 rounded-xl"><Plus className="w-4 h-4" /></Button>
                </div>
                <p className="text-[10px] text-on-surface-variant italic">Ces thématiques apparaîtront comme filtres pour les résidents.</p>
             </Card>

             {/* Form Card for New Document */}
             <Card className="bg-surface border-2 border-primary/20 p-6 rounded-2xl flex flex-col gap-4 shadow-lg shadow-primary/5 lg:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FilePlus className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-on-surface">Ajouter un Nouveau Protocole PDF</h3>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant/60 ml-1">Titre du document</label>
                        <Input 
                            placeholder="ex: Protocole Biopsie Hépatique" 
                            value={newDoc.titre}
                            onChange={(e) => setNewDoc({...newDoc, titre: e.target.value})}
                            className="bg-surface-container-low border-outline/10"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant/60 ml-1">Organe / Thématique</label>
                        <select 
                            value={newDoc.organe}
                            onChange={(e) => setNewDoc({...newDoc, organe: e.target.value})}
                            className="w-full h-10 px-3 bg-surface-container-low border border-outline/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">-- Sélectionner --</option>
                            {categoriesList.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline/5">
                    <p className="text-[11px] text-on-surface-variant italic">
                        1. Sélectionnez l'organe. 2. Cliquez sur "Uploader un PDF" en haut à droite.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        {newDoc.titre && newDoc.organe ? "✅ Prêt pour l'envoi" : "❌ Complétez les champs"}
                    </div>
                </div>
             </Card>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.length === 0 && !isUploading && (
                <div className="col-span-full py-20 text-center glass-panel rounded-3xl border border-dashed border-outline/20">
                    <p className="text-on-surface-variant">Aucun document dans la thématique.</p>
                </div>
            )}

            {documents.map((doc) => (
              <Card key={doc.id} className="bg-surface border-outline/10 p-6 rounded-2xl flex flex-col hover:border-primary/30 transition-all hover:shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-secondary/10 rounded-xl">
                    <FileText className="w-6 h-6 text-secondary" />
                  </div>
                  <span className="bg-surface-container-highest text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider text-on-surface">{doc.organe}</span>
                </div>
                <h3 className="font-bold text-on-surface text-lg mb-1 line-clamp-2 leading-tight">{doc.titre}</h3>
                <div className="flex items-center justify-between mt-auto pt-4 text-xs text-on-surface-variant">
                  <span className="flex items-center"><Settings className="w-3 h-3 mr-1"/> {doc.taille}</span>
                  <span>{new Date(doc.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-outline/10">
                   <Button asChild variant="outline" size="sm" className="flex-1 rounded-xl">
                       <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                           <Download className="w-4 h-4 mr-2"/> Voir
                       </a>
                   </Button>
                   <Button onClick={() => handleDeleteDoc(doc.id, doc.url)} variant="ghost" size="icon" className="text-error hover:bg-error/10 hover:text-error rounded-xl"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
