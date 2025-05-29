import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/use-tasks";
import TaskCard from "@/components/task-card";
import TranscriptInput from "@/components/transcript-input";
import { 
  ClipboardList, 
  Settings, 
  User, 
  FileText, 
  Mic, 
  Zap,
  Download,
  Trash2,
  Grid3X3,
  List,
  Info
} from "lucide-react";

export default function TaskConverter() {
  const [inputMethod, setInputMethod] = useState<'text' | 'audio'>('text');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();
  const { 
    tasks, 
    isLoading: tasksLoading, 
    extractFromTranscript, 
    extractFromAudio, 
    updateTask,
    deleteTask,
    clearAllTasks,
    isExtracting 
  } = useTasks();

  const handleClearAll = async () => {
    try {
      await clearAllTasks();
      toast({
        title: "Tasks cleared",
        description: "All tasks have been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    if (tasks.length === 0) {
      toast({
        title: "No tasks to export",
        description: "Extract some tasks first before exporting.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Task', 'Assigned To', 'Due Date/Time', 'Priority'];
    const csvContent = [
      headers.join(','),
      ...tasks.map(task => [
        `"${task.description}"`,
        `"${task.assignee}"`,
        `"${task.deadline}"`,
        task.priority
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Tasks have been exported to CSV.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">AI Task Converter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Convert Meeting Minutes to Tasks</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Powered by</span>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-900">OpenAI</span>
                </div>
              </div>
            </div>

            {/* Input Method Toggle */}
            <div className="mb-6">
              <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
                <Button
                  variant={inputMethod === 'text' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInputMethod('text')}
                  className={inputMethod === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Text Input
                </Button>
                <Button
                  variant={inputMethod === 'audio' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInputMethod('audio')}
                  className={inputMethod === 'audio' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Audio/Video Upload
                </Button>
              </div>
            </div>

            <TranscriptInput
              inputMethod={inputMethod}
              onExtractFromTranscript={extractFromTranscript}
              onExtractFromAudio={extractFromAudio}
              isExtracting={isExtracting}
            />

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center text-sm text-gray-500">
                <Info className="w-4 h-4 mr-1" />
                AI will automatically extract tasks, assignees, and deadlines
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">Extracted Tasks</h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {tasks.length} tasks
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'text-gray-600' : 'text-gray-400'}
                >
                  <Grid3X3 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'text-gray-600' : 'text-gray-400'}
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {tasksLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks extracted yet</h3>
                <p className="text-gray-500 mb-4">Paste your meeting transcript above and click "Extract Tasks" to get started.</p>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
                  {tasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      viewMode={viewMode}
                      onTaskUpdate={async (taskId, updates) => {
                        try {
                          await updateTask({ id: taskId, updates });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to update task. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                      onTaskDelete={async (taskId) => {
                        try {
                          await deleteTask(taskId);
                        } catch (error) {
                          toast({
                            title: "Error", 
                            description: "Failed to delete task. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                    />
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                      <Download className="w-4 h-4 mr-1" />
                      Export to CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClearAll}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Last updated: Just now
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
