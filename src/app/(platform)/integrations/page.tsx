import { Plug } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const integrations = [
  { name: "Supabase",          status: "disconnected", description: "PostgreSQL database and file storage"       },
  { name: "HuggingFace",       status: "disconnected", description: "AI embeddings and LLM inference"            },
  { name: "Qdrant",            status: "disconnected", description: "Vector database for semantic search"         },
  { name: "Neo4j",             status: "disconnected", description: "Knowledge graph database"                   },
  { name: "WhatsApp (Meta)",   status: "disconnected", description: "Lead notification via WhatsApp Business API"},
  { name: "Twilio",            status: "disconnected", description: "Alternative WhatsApp / SMS provider"        },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">Manage external service connections and API keys.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((item) => (
          <Card key={item.name} className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plug className="h-4 w-4 text-zinc-400" />
                  {item.name}
                </CardTitle>
                <Badge
                  variant={item.status === "connected" ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {item.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
