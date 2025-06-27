import { Upload, Play, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ConteudoTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Conteúdo</h2>
        <p className="text-gray-600">Upload e organização de materiais didáticos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivos</CardTitle>
            <CardDescription>Adicione vídeos, PDFs, imagens e outros materiais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Arraste arquivos aqui ou clique para selecionar</p>
              <Button variant="outline" className="mt-4">
                Selecionar Arquivos
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Curso de Destino</label>
              <select className="w-full p-2 border rounded-md">
                <option>Selecione um curso</option>
                <option>Pintura em Tela</option>
                <option>Escultura em Argila</option>
                <option>Desenho Artístico</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biblioteca de Mídia</CardTitle>
            <CardDescription>Arquivos recentemente adicionados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-2 border rounded">
                <Play className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">introducao-cores.mp4</p>
                  <p className="text-xs text-gray-500">45 MB • Hoje</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2 border rounded">
                <FileText className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">apostila-desenho.pdf</p>
                  <p className="text-xs text-gray-500">2.3 MB • Ontem</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2 border rounded">
                <Play className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">tecnicas-argila.mp4</p>
                  <p className="text-xs text-gray-500">67 MB • 2 dias atrás</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}