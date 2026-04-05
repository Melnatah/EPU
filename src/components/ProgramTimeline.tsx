import React from "react";
import { motion } from "motion/react";
import { Clock, Users, Play, Coffee, Utensils, Award, Shield } from "lucide-react";

interface ProgramItemProps {
  time: string;
  title: string;
  speaker?: string;
  description?: string;
  icon: React.ElementType;
  index: number;
  key?: any;
}

const ProgramItem = ({ time, title, speaker, description, icon: Icon, index }: ProgramItemProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative pl-8 pb-12 last:pb-0"
    >
      {/* Timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-outline-variant/30 ml-[15px]"></div>
      
      {/* Circle Icon */}
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-surface border border-primary/20 flex items-center justify-center z-10 shadow-sm transition-transform hover:scale-110 duration-300">
        <Icon className="w-4 h-4 text-primary" />
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-outline/10 hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
            <Clock className="w-3 h-3 mr-2" />
            {time}
          </div>
          {speaker && (
            <div className="flex items-center text-xs text-on-surface-variant font-medium">
              <Users className="w-3 h-3 mr-2" />
              {speaker}
            </div>
          )}
        </div>
        <h4 className="text-xl font-headline font-extrabold text-on-surface group-hover:text-primary transition-colors mb-2">
          {title}
        </h4>
        {description && (
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default function ProgramTimeline() {
  const programData: Array<Omit<ProgramItemProps, "index">> = [
    {
      time: "07:30",
      title: "Accueil et Installation",
      description: "Arrivée des participants et ouverture solennelle de l'EPU par le CERT.",
      icon: Users,
      speaker: "Comité d'organisation CERT",
    },
    {
      time: "08:00",
      title: "Pré-test Théorique",
      description: "Évaluation initiale des connaissances théoriques des participants.",
      icon: Award,
      speaker: "Dr KOUTOGLO, Dr BARRY",
    },
    {
      time: "08:15",
      title: "Essentiel de la Biopsie Mammaire",
      description: "Présentation des concepts clés et fondamentaux de la biopsie mammaire.",
      icon: Play,
      speaker: "Dr KOUTOGLO, Dr BARRY",
    },
    {
      time: "08:35",
      title: "Gestion du Prélèvement",
      description: "Techniques et bonnes pratiques pour la manipulation et la gestion des prélèvements.",
      icon: Shield,
      speaker: "Dr DOH (Anatomopathologiste)",
    },
    {
      time: "08:50",
      title: "Débat et Partage d'Expérience",
      description: "Échanges interactifs sur la pratique clinique de la biopsie mammaire.",
      icon: Users,
      speaker: "CERT",
    },
    {
      time: "09:15",
      title: "Pause Café",
      description: "Moment de détente et réseautage.",
      icon: Coffee,
    },
    {
      time: "09:30 - 12:30",
      title: "Séances Pratiques",
      description: "Ateliers d'immersion technique et manipulation sous guidage échographique.",
      icon: Play,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 shadow-2xl relative">
       {/* Background decorative elements */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
       <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

       <div className="flex flex-col gap-2 mb-12 text-center md:text-left">
          <h3 className="text-3xl md:text-4xl font-headline font-black text-on-surface tracking-tight">
            Programme du <span className="text-primary italic">11 Avril 2026</span>
          </h3>
          <p className="text-on-surface-variant max-w-2xl">
            Une journée immersive alliant rigueur académique et pratique clinique intensive pour avoir une base solide des gestes techniques.
          </p>
       </div>

       <div className="mt-8">
          {programData.map((item, index) => (
            <ProgramItem 
              key={index} 
              time={item.time}
              title={item.title}
              description={item.description}
              speaker={item.speaker}
              icon={item.icon}
              index={index} 
            />
          ))}
       </div>
    </div>
  );
}
