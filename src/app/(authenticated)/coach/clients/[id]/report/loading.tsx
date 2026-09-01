import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoadingClientReport() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-neutral-200 rounded animate-pulse"></div>
      </div>

      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="h-6 w-32 bg-neutral-200 rounded animate-pulse"></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-16 w-full bg-neutral-100 rounded animate-pulse"></div>
            <div className="h-16 w-full bg-neutral-100 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
