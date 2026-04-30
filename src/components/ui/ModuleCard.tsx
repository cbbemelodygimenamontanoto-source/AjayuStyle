import { ModuleCard as ModuleCardType } from '@/types';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ModuleCardProps {
  module: ModuleCardType;
  index: number;
  onClick?: () => void;
}

export default function ModuleCard({ module, index, onClick }: ModuleCardProps) {
  const isOptional = module.isOptional;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Card
        className={cn(
          'h-full flex flex-col cursor-pointer group',
          'relative overflow-hidden'
        )}
        onClick={onClick}
      >
        {/* Badge opcional para red social */}
        {isOptional && (
          <div className="absolute top-4 right-4 z-10">
            <span className="bg-accent-gold text-neutral-900 text-xs font-medium px-2 py-1 rounded-full">
              Opcional
            </span>
          </div>
        )}
        
        {/* Icono del módulo */}
        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300',
          module.color
        )}>
          {module.icon}
        </div>
        
        {/* Contenido */}
        <div className="flex-1">
          <h3 className="text-2xl font-semibold font-serif text-neutral-900 mb-4 group-hover:text-primary-500 transition-colors duration-300">
            {module.title}
          </h3>
          
          <p className="text-neutral-600 leading-relaxed mb-6">
            {module.description}
          </p>
          
          {/* Lista de características */}
          <ul className="space-y-2">
            {module.features.map((feature, idx) => (
              <li key={idx} className="flex items-start">
                <div className={cn(
                  'w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0',
                  module.color.includes('blue') && 'bg-blue-500',
                  module.color.includes('purple') && 'bg-purple-500',
                  module.color.includes('pink') && 'bg-pink-500',
                  module.color.includes('green') && 'bg-green-500'
                )} />
                <span className="text-sm text-neutral-600">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Indicador de hover */}
        <div className="mt-6 pt-4 border-t border-neutral-100">
          <span className="text-primary-500 font-medium text-sm group-hover:translate-x-2 transition-transform duration-300 inline-flex items-center">
            Explorar módulo
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
        
        {/* Overlay de gradiente en hover */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'
        )} />
      </Card>
    </motion.div>
  );
}