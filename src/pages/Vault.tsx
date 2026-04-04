import { useState, useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/src/components/ui/button";
import { FileText, Download, Lock, Trash2, Loader2, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";
import { supabase } from "@/src/lib/supabase";
import { Input } from "@/src/components/ui/input";

export default function Vault() {
  const { isRegistered } = useAuth();
  const [filter, setFilter] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["Tous"]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: docData } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: catData } = await supabase
        .from('categories')
        .select('name')
        .order('name');

      setDocuments(docData || []);
      if (catData) {
          setCategories(["Tous", ...catData.map(c => c.name)]);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err: any) {
      console.error("Erreur lors de la suppression:", err);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesFilter = filter === "Tous" || doc.organe === filter;
    const matchesSearch = doc.titre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 px-4 py-8 md:px-6 md:py-12 max-w-7xl mx-auto w-full">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8 mb-8 md:mb-12">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-headline mb-3 md:mb-4 uppercase tracking-tighter text-on-surface">
            La Thématique
          </h1>
          <p className="text-on-surface-variant max-w-xl text-base md:text-lg mb-6">
            Votre bibliothèque numérique sécurisée. Téléchargez les protocoles officiels au format PDF interactif (EPU 2026).
          </p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
            <Input 
              placeholder="Rechercher un protocole..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-surface-container-high border-outline/10 h-12 rounded-2xl"
            />
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map(organ => (
            <button
              key={organ}
              onClick={() => setFilter(organ)}
              className={cn(
                "px-4 py-1.5 md:px-6 md:py-2 rounded-full font-bold text-xs md:text-sm transition-all",
                filter === organ 
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20" 
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-bright"
              )}
            >
              {organ}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-[400px]">
        {/* Document List */}
        <div className={cn("space-y-3 transition-all duration-500", !isRegistered && "opacity-30 pointer-events-none select-none blur-[2px]")}>
          {/* Header Row (Desktop) */}
          <div className="hidden lg:grid grid-cols-[1fr_120px_150px_120px] px-8 py-4 text-xs font-headline uppercase tracking-widest text-on-surface-variant/70">
            <span>Document</span>
            <span>Taille</span>
            <span>Dernière MAJ</span>
            <span className="text-right px-4">Actions</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 text-on-surface-variant">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
              <p>Chargement de votre bibliothèque...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center glass-panel rounded-3xl border border-outline/10">
               <FileText className="w-16 h-16 text-on-surface-variant/20 mb-4" />
               <p className="text-on-surface-variant text-lg">Aucun document trouvé dans cette catégorie.</p>
            </div>
          ) : (
            filteredDocs.map((doc, i) => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_120px_150px_120px] gap-4 items-center px-4 py-4 md:px-6 md:py-5 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-all border-l-4 border-transparent hover:border-primary border border-outline/5"
              >
                <div className="flex items-center gap-3 md:gap-4 font-normal">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-error-container/20 flex items-center justify-center shrink-0">
                    <FileText className="text-error h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm md:text-base text-on-surface group-hover:text-primary transition-colors line-clamp-2 md:line-clamp-1">{doc.titre}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-tight font-bold">Organe: {doc.organe} <span className="lg:hidden">• {doc.taille}</span></p>
                  </div>
                </div>
                <span className="hidden lg:block text-sm text-on-surface-variant font-medium">{doc.taille}</span>
                <span className="hidden lg:block text-sm text-on-surface-variant font-medium">{new Date(doc.created_at).toLocaleDateString("fr-FR")}</span>
                <div className="flex justify-end gap-2 items-center">
                  <Button asChild size="icon" variant="ghost" className="rounded-full h-8 w-8 md:h-10 md:w-10 text-on-surface-variant hover:text-primary hover:bg-primary/10">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button 
                    onClick={() => handleDelete(doc.id)}
                    size="icon" 
                    variant="ghost" 
                    className="rounded-full h-8 w-8 md:h-10 md:w-10 text-on-surface-variant hover:text-error hover:bg-error/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Locked Overlay */}
        {!isRegistered && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-background/40 backdrop-blur-sm">
            <div className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col items-center text-center max-w-md border border-outline-variant/20 shadow-2xl mx-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 md:mb-6">
                <Lock className="text-primary h-6 w-6 md:h-8 md:w-8" />
              </div>
              <h3 className="font-headline text-xl md:text-2xl font-bold mb-2 md:mb-3 text-on-surface">Contenu Verrouillé</h3>
              <p className="text-sm md:text-base text-on-surface-variant mb-6 md:mb-8 leading-relaxed">
                Inscrivez-vous pour débloquer l'accès complet aux protocoles et ressources de l'EPU.
              </p>
              <Button asChild size="lg" className="w-full">
                <Link to="/register">S'inscrire Maintenant</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
