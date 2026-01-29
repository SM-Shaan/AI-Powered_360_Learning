import { cn } from '../../lib/utils';

export function PageHeader({
  title,
  description,
  icon: Icon,
  gradient = 'from-emerald-600 via-teal-600 to-cyan-600',
  pattern = true,
  children,
  className
}) {
  return (
    <div className={cn(
      "relative overflow-hidden bg-gradient-to-r text-white",
      gradient,
      className
    )}>
      {pattern && (
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
      )}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center gap-3 mb-2">
          {Icon && <Icon className="w-7 h-7 sm:w-8 sm:h-8" />}
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
        </div>
        {description && (
          <p className="text-white/80 text-base sm:text-lg max-w-2xl">
            {description}
          </p>
        )}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export function PageContainer({ children, className }) {
  return (
    <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8", className)}>
      {children}
    </div>
  );
}

export function Section({ title, description, children, className }) {
  return (
    <section className={cn("mb-8", className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-gray-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function ContentCard({ children, className, hover = true }) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden",
      hover && "hover:shadow-md transition-shadow duration-200",
      className
    )}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center",
      className
    )}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {action && action}
    </div>
  );
}

export function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-emerald-500 animate-spin" />
      </div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export function StatCard({ value, label, icon: Icon, color = "emerald" }) {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600"
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={cn("p-3 rounded-xl", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
