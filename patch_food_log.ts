import fs from 'fs';
const path = 'src/components/food/DailyFoodLogView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'alt="Meal Photo"',
  'alt={`Photo of ${meal.mealType} logged on ${new Date(meal.date).toLocaleDateString()}`}'
);

fs.writeFileSync(path, content);
console.log("Patched DailyFoodLogView.tsx");
