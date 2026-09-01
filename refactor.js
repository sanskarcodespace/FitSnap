const fs = require('fs');
const path = require('path');

const files = [
  "src/app/(authenticated)/coach/clients/[id]/CoachFoodHistoryTab.tsx",
  "src/app/(authenticated)/coach/clients/[id]/CoachProgressTab.tsx",
  "src/app/(authenticated)/coach/clients/[id]/CoachHabitsTab.tsx",
  "src/app/(authenticated)/coach/clients/[id]/CoachCheckinsTab.tsx",
  "src/app/(authenticated)/client/progress/BodyMeasurementsTab.tsx",
  "src/app/(authenticated)/client/progress/WeightTab.tsx",
  "src/app/(authenticated)/client/habits/ClientHabitsView.tsx",
  "src/app/(authenticated)/client/food/FoodHistoryTab.tsx",
  "src/app/(authenticated)/client/checkins/ClientCheckinsView.tsx"
];

for (const f of files) {
  const filePath = path.join(__dirname, f);
  if (!fs.existsSync(filePath)) {
    console.log("Missing:", f);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import
  if (!content.includes('PeriodSelector')) {
    content = content.replace(
      /(import \{.*?\} from "@\/components\/ui\/.*?")/,
      `$1\nimport { PeriodSelector } from "@/components/ui/period-selector"`
    );
  }

  // Find the name of the fetch function inside handleCustomSearch
  const match = content.match(/const handleCustomSearch = \(\) => \{[\s\S]*?(fetch[A-Za-z0-9_]*|load[A-Za-z0-9_]*)\(startDate, endDate\)/);
  let fetchFn = "fetchData";
  if (match && match[1]) {
    fetchFn = match[1];
  } else {
    // some might use start, end variables
    const match2 = content.match(/const handleCustomSearch = \(\) => \{[\s\S]*?(fetch[A-Za-z0-9_]*|load[A-Za-z0-9_]*)\(start, end\)/);
    if (match2 && match2[1]) fetchFn = match2[1];
  }

  // Replace handleCustomSearch definition to just be a simple wrapper if we want, or just leave it for PeriodSelector to call
  // Actually, PeriodSelector takes onApplyCustom={handleCustomSearch}

  // The UI block to replace:
  // Starts with `<div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-[var(--color-neutral-200)] shadow-sm">`
  // And ends with the closing `</div>` of that flex container.
  
  const uiRegex = /<div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-\[var\(--color-neutral-200\)\] shadow-sm">[\s\S]*?<\/Select>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
  
  const uiReplacement = `<div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-[var(--color-neutral-200)] shadow-sm">
        <PeriodSelector 
          period={period}
          onPeriodChange={(p, s, e) => {
            setPeriod(p as any)
            setStartDate(s)
            setEndDate(e)
            ${fetchFn}(s, e)
          }}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onApplyCustom={handleCustomSearch}
        />
      </div>`;

  if (uiRegex.test(content)) {
    content = content.replace(uiRegex, uiReplacement);
    fs.writeFileSync(filePath, content);
    console.log("Updated", f);
  } else {
    console.log("Could not find UI block in", f);
  }
}
