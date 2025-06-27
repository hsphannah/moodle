import { Play, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Aula = {
  id: number;
  titulo: string;
  curso: string;
  duracao: string;
  tipo: string;
  visualizacoes: number;
  data: string;
}

interface AulasTabProps {
  aulas: Aula[];
}

export default function AulasTab({ aulas }: AulasTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Aulas</h2>
          <p className="text-gray-600">Gerencie o conteúdo das suas aulas</p>
        </div>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          Nova Aula
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Aulas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aulas.map((aula) => (
              <div
                key={aula.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {aula.tipo === "Vídeo" ? (
                      <Play className="w-5 h-5 text-blue-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{aula.titulo}</p>
                    <p className="text-sm text-gray-500">{aula.curso}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{aula.duracao}</p>
                    <p className="text-xs text-gray-500">Duração</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium">{aula.visualizacoes}</p>
                    <p className="text-xs text-gray-500">Visualizações</p>
                  </div>

                  <Badge variant="outline">{aula.tipo}</Badge>

                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}