import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// Definimos o tipo de dado para um curso
type Curso = {
  id: number;
  nome: string;
  descricao: string;
  alunos: number;
  aulas: number;
  progresso: number;
  status: string;
  cor: string;
}

// Definimos as propriedades que o nosso componente vai receber
interface CursosTabProps {
  cursos: Curso[];
}

export default function CursosTab({ cursos }: CursosTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cursos</h2>
          <p className="text-gray-600">Gerencie seus cursos e conteúdos</p>
        </div>
        <Button>
          <BookOpen className="mr-2 h-4 w-4" />
          Novo Curso
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cursos.map((curso) => (
          <Card key={curso.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${curso.cor}`}></div>
                <Badge variant="secondary">{curso.status}</Badge>
              </div>
              <CardTitle className="text-lg">{curso.nome}</CardTitle>
              <CardDescription>{curso.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Progresso Geral</span>
                <span className="font-medium">{curso.progresso}%</span>
              </div>
              <Progress value={curso.progresso} className="h-2" />

              <div className="flex justify-between text-sm text-gray-500">
                <span>{curso.alunos} alunos</span>
                <span>{curso.aulas} aulas</span>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Ver Detalhes
                </Button>
                <Button size="sm" className="flex-1">
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}