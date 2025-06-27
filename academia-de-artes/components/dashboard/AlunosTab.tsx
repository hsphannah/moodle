import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Aluno = {
  id: number;
  nome: string;
  email: string;
  curso: string;
  progresso: number;
  ultimoAcesso: string;
  status: string;
}

interface AlunosTabProps {
  alunos: Aluno[];
}

export default function AlunosTab({ alunos }: AlunosTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alunos</h2>
          <p className="text-gray-600">Acompanhe o desempenho dos seus alunos</p>
        </div>
        <Button>
          <Users className="mr-2 h-4 w-4" />
          Adicionar Aluno
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alunos.map((aluno) => (
              <div
                key={aluno.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                    <AvatarFallback>
                      {aluno.nome
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{aluno.nome}</p>
                    <p className="text-sm text-gray-500">{aluno.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{aluno.curso}</p>
                    <p className="text-xs text-gray-500">Curso</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium">{aluno.progresso}%</p>
                    <p className="text-xs text-gray-500">Progresso</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium">{aluno.ultimoAcesso}</p>
                    <p className="text-xs text-gray-500">Último acesso</p>
                  </div>

                  <Badge variant={aluno.status === "Ativo" ? "default" : "secondary"}>{aluno.status}</Badge>

                  <Button variant="outline" size="sm">
                    Ver Perfil
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