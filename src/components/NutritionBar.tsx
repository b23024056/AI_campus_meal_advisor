interface Props {
  protein: number;
  fat: number;
  carbs: number;
}

export default function NutritionBar({ protein, fat, carbs }: Props) {
  const total = protein + fat + carbs;
  if (total === 0) return null;

  const pPct = (protein / total) * 100;
  const fPct = (fat / total) * 100;
  const cPct = (carbs / total) * 100;

  return (
    <div className="mt-2">
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        <div className="bg-blue-400 rounded-l-full transition-all" style={{ width: `${pPct}%` }} title={`タンパク質 ${protein}g`} />
        <div className="bg-yellow-400 transition-all" style={{ width: `${fPct}%` }} title={`脂質 ${fat}g`} />
        <div className="bg-orange-300 rounded-r-full transition-all" style={{ width: `${cPct}%` }} title={`炭水化物 ${carbs}g`} />
      </div>
      <div className="flex gap-3 mt-1">
        <span className="text-xs text-blue-500">P {protein}g</span>
        <span className="text-xs text-yellow-600">F {fat}g</span>
        <span className="text-xs text-orange-500">C {carbs}g</span>
      </div>
    </div>
  );
}
