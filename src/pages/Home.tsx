import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { ShieldCheck, BookOpen, Award, ArrowRight, Activity, Microscope } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  // Amplitude of rotation 3D
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative w-full h-full transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${className}`}
    >
      <div 
        style={{ transform: "translateZ(75px)", transformStyle: "preserve-3d" }}
        className="w-full h-full"
      >
        {children}
      </div>
    </motion.div>
  );
};

const AnimatedBackground = () => {
  const particles = Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    top: Math.random() * 100 + "%",
    left: Math.random() * 100 + "%",
    duration: Math.random() * 20 + 20,
    delay: Math.random() * 15,
    size: Math.random() * 5 + 2,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-surface">
      {/* Uploaded Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 dark:opacity-20" 
        style={{ backgroundImage: "url('/bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-surface/80 via-surface/60 to-surface/90 backdrop-blur-[2px]" />

      {/* Floating Stars / Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
          style={{ width: p.size, height: p.size, top: p.top, left: p.left }}
          animate={{
             y: [0, -250],
             x: [0, Math.random() > 0.5 ? 60 : -60],
             opacity: [0, 1, 0],
             scale: [0.5, 1.5, 0.5]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}

      {/* Very faint, slow moving aurora blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.15, 0.1],
          rotate: [0, 45, 0]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/30 blur-[150px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[0%] right-[0%] w-[60vw] h-[60vw] rounded-full bg-on-primary-container/20 blur-[150px]" 
      />
    </div>
  );
};

export default function Home() {
  const { isRegistered, user } = useAuth();
  
  return (
    <div className="flex-1 flex flex-col relative w-full overflow-hidden">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24 lg:py-32 w-full mx-auto max-w-7xl z-10 flex flex-col justify-center min-h-[85vh]">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="z-10"
          >
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary mb-8 backdrop-blur-md font-medium">
              <span className="relative flex h-3 w-3 mr-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              Session Principale: 11 Avril 2026
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold font-headline leading-[1.1] mb-6 text-on-surface tracking-tight">
              Maîtrisez les Fondamentaux <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-on-primary-container drop-shadow-sm pb-2 inline-block">
                de la Biopsie d'Organe
              </span>
            </h1>
            <p className="text-base md:text-xl text-on-surface-variant mb-10 max-w-xl leading-relaxed font-normal">
              Votre espace de préparation dédié. Accédez à toutes les ressources documentaires essentielles pour acquérir des bases solides avant la journée de pratique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="h-14 px-8 rounded-full shadow-xl shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/40 duration-300">
                <Link to={isRegistered ? "/vault" : "/register"} className="text-lg font-medium">
                  {isRegistered ? `Salut, ${user?.firstName || "Résident"}` : "Rejoindre l'EPU"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-full glass-panel border-outline/20 hover:bg-surface-container-low transition-all duration-300">
                <Link to="/vault" className="text-lg font-medium">
                  Explorer la Thématique
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:block"
            style={{ perspective: 1500 }}
          >
            <TiltCard>
              <div className="relative aspect-square rounded-[3rem] overflow-hidden glass-panel border border-white/20 shadow-2xl group bg-white/10 dark:bg-black/10">
                 {/* Animated dynamic elements for Hero visual */}
                 <div className="absolute inset-0 bg-gradient-to-br from-surface/40 to-surface-container-low/40 mix-blend-overlay z-0"></div>
                 
                 {/* Grid Background overlay */}
                 <div className="absolute inset-0 z-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMCwgMCwgMCwgMC41KSIvPjwvc3ZnPg==')]" />
               
               <div className="absolute inset-0 flex flex-col items-center justify-center z-10 transition-transform duration-700 group-hover:scale-110">
                  <motion.div 
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="p-8 rounded-3xl bg-surface/50 backdrop-blur-xl border border-white/40 shadow-2xl mb-8 group-hover:shadow-primary/30 group-hover:border-primary/30 transition-colors"
                  >
                    <Microscope className="w-24 h-24 text-primary drop-shadow-md" />
                  </motion.div>
                  
                  <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="flex gap-4"
                  >
                     <div className="p-4 rounded-2xl bg-primary-container/80 backdrop-blur-md border border-primary/20 shadow-lg">
                       <Activity className="w-8 h-8 text-on-primary-container" />
                     </div>
                     <div className="p-4 rounded-2xl bg-surface/80 backdrop-blur-md border border-white/20 shadow-lg">
                       <ShieldCheck className="w-8 h-8 text-primary" />
                     </div>
                  </motion.div>
               </div>
              </div>
            </TiltCard>
            
            {/* Floating Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
              className="absolute -bottom-10 -left-10 bg-surface/80 backdrop-blur-2xl p-6 rounded-3xl border border-outline/10 shadow-2xl max-w-xs z-30 pointer-events-none"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="text-primary h-6 w-6" />
                </div>
                <span className="font-headline font-bold text-lg text-on-surface leading-tight">Préparation<br/>Optimale</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">Anticipez le Jour J avec notre base documentaire complète.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="relative z-10 px-4 py-24 w-full mt-12 bg-gradient-to-b from-transparent to-surface-container-lowest/50 via-surface/30">
        <div className="absolute inset-0 backdrop-blur-3xl border-t border-outline/5 -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 max-w-6xl mx-auto text-left">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group"
              style={{ perspective: 1200 }}
            >
              <TiltCard className="rounded-[2rem] bg-surface/60 backdrop-blur-xl border border-outline/10 shadow-lg group-hover:block transition-colors p-8">
                <div className="flex flex-col h-full pointer-events-none">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <BookOpen className="text-primary h-7 w-7" />
                  </div>
                  <h3 className="text-3xl font-extrabold font-headline mb-6 text-on-surface drop-shadow-md">Pourquoi cet EPU ?</h3>
                  <p className="text-on-surface-variant leading-relaxed text-lg md:text-xl text-left font-normal">
                    Dans le contexte de l'<strong>Afrique subsaharienne</strong>, la biopsie, et plus particulièrement la <strong>biopsie échoguidée</strong>, représente notre meilleure alliée diagnostique. Face au coût élevé et à l'accessibilité parfois limitée de la tomodensitométrie (TDM), l'échoguidage offre une alternative fiable, précise et <strong>économiquement viable</strong> pour une prise en charge optimale de nos patients. Cet EPU est né de la volonté de démocratiser et de perfectionner ce geste indispensable.
                  </p>
                </div>
              </TiltCard>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group"
              style={{ perspective: 1200 }}
            >
              <TiltCard className="rounded-[2rem] bg-surface/60 backdrop-blur-xl border border-outline/10 shadow-lg group-hover:block transition-colors p-8">
                <div className="flex flex-col h-full pointer-events-none">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <ShieldCheck className="text-primary h-7 w-7" />
                  </div>
                  <h3 className="text-3xl font-extrabold font-headline mb-6 text-on-surface drop-shadow-md">Le but de l'EPU</h3>
                  <p className="text-on-surface-variant leading-relaxed text-lg md:text-xl text-left font-normal">
                    L'objectif premier est de vous fournir des bases théoriques inébranlables avant la manipulation. En ayant un accès anticipé à la <strong>Thématique de documents spécifiques</strong> (sein, thyroïde...), vous assimilerez les prérequis à votre propre rythme. L'ambition est que vous arriviez à l'atelier pratique du <strong>Jour J parfaitement rôdé</strong>, prêt à vous concentrer exclusivement sur la technique gestuelle.
                  </p>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partenaires Section */}
      <section className="relative z-10 px-4 py-16 w-full bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold font-headline mb-10 text-on-surface opacity-80 uppercase tracking-widest text-sm">
            Nos Partenaires Institutionnels
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.1, rotate: 2 }} 
              className="h-24 w-56 md:h-28 md:w-64 relative flex items-center justify-center cursor-pointer"
            >
              <img src="/strim.png" alt="STRIM" className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.1, rotate: -2 }} 
              className="h-24 w-56 md:h-28 md:w-64 relative flex items-center justify-center cursor-pointer"
            >
              <img src="/stum.png" alt="STUM" className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.3, duration: 0.5 }}
               whileHover={{ scale: 1.1, rotate: 2 }} 
               className="h-24 w-56 md:h-28 md:w-64 relative flex items-center justify-center cursor-pointer"
            >
              <img src="/univ-lome.png" alt="Université de Lomé" className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
