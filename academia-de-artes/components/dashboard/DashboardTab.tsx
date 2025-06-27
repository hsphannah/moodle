import {
  Users,
  BookOpen,
  Play,
  Award,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

// Definimos os tipos de dados que vamos receber.
// É uma boa prática para garantir que estamos passando as coisas certas.
type Curso = {
  id: number;
  nome: string;
  progresso: number;
}

type Aluno = {
  id: number;
  nome: string;
  curso: string;
  progresso: number;
  ultimoAcesso: string;
}

interface DashboardTabProps {
  cursos: Curso[];
  alunos: Aluno[];
}

export default function DashboardTab({ cursos, alunos }: DashboardTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Visão geral da sua academia</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">74</div>
            <p className="text-xs text-muted-foreground">+12% desde o mês passado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Ativos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">100% de ocupação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Publicadas</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-muted-foreground">+5 esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">+3% desde o mês passado</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progresso dos Cursos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cursos.map((curso) => (
              <div key={curso.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{curso.nome}</span>
                  <span className="text-sm text-gray-500">{curso.progresso}%</span>
                </div>
                <Progress value={curso.progresso} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alunos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alunos.slice(0, 3).map((aluno) => (
                <div key={aluno.id} className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                    <AvatarFallback>
                      {aluno.nome
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{aluno.nome}</p>
                    <p className="text-xs text-gray-500">{aluno.curso}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{aluno.progresso}%</p>
                    <p className="text-xs text-gray-500">{aluno.ultimoAcesso}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}