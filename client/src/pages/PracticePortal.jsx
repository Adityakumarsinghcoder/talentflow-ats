import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { ArrowLeft, Sparkles, Send, Award, MessageSquare, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function PracticePortal() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(['', '', '']);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [grading, setGrading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, [applicationId]);

  const fetchQuestions = async () => {
    try {
      setLoadingQuestions(true);
      setError(null);
      const res = await api.get(`/interviews/practice/questions?applicationId=${applicationId}`);
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error('Error fetching practice questions:', err);
      setError('Could not generate practice questions. Make sure your application exists and is in progress.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAnswerChange = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (questions.length === 0) return;

    try {
      setGrading(true);
      setError(null);
      const res = await api.post('/interviews/practice/grade', {
        applicationId,
        questions,
        answers: answers.slice(0, questions.length),
      });
      setReport(res.data);
    } catch (err) {
      console.error('Error grading practice answers:', err);
      setError('Failed to grade answers. Please try again.');
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Back Header */}
      <button 
        onClick={() => navigate('/applications')} 
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Applications
      </button>

      {/* Intro Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> AI Practice Interview Portal
          </h1>
          <p className="text-xs text-slate-400">Answer customized technical questions generated based on your applied job and receive real-time grading reports.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loadingQuestions ? (
        <div className="glass-card rounded-2xl p-12 text-center text-xs text-slate-500">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse mx-auto mb-3" />
          Analyzing Job Description and generating custom technical questions...
        </div>
      ) : report ? (
        /* Grading Report Panel */
        <div className="space-y-6 animate-fade-in">
          
          {/* Main Scorecard Header */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-base font-bold text-slate-200">Practice Scorecard Report</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{report.overallFeedback}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-indigo-400">{report.overallScore}%</span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Rating</span>
              </div>
              <div className="text-xs text-slate-400">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Answers graded</div>
                <div className="flex items-center gap-1.5 mt-1.5"><Award className="w-4 h-4 text-amber-400" /> Feedback detailed</div>
              </div>
            </div>
          </div>

          {/* Individual Question Evaluations */}
          <div className="space-y-4">
            {report.gradings.map((g, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-xs font-bold text-slate-200">
                    <span className="text-indigo-400 font-extrabold">Q{idx + 1}:</span> {g.question}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-indigo-950/45 text-[10px] font-bold text-indigo-400 border border-indigo-500/25 shrink-0">
                    {g.score} / 10
                  </span>
                </div>
                
                <div className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 text-[11px] text-slate-300 leading-normal font-medium">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Your Answer:</span>
                  {g.answer || "No answer submitted."}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/25 border border-slate-800/80 text-[11px] text-indigo-300 leading-normal">
                  <span className="text-[10px] font-bold text-indigo-500/70 uppercase tracking-wider block mb-1">AI Assessor Feedback:</span>
                  {g.feedback}
                </div>

                <div className="p-3.5 rounded-xl bg-dark-950 border border-emerald-950/30 text-[11px] text-emerald-400/90 leading-normal">
                  <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-wider block mb-1">Ideal Model Answer:</span>
                  {g.modelAnswer}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setReport(null);
                setAnswers(['', '', '']);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs transition"
            >
              Retry Practice Session
            </button>
            <button
              onClick={() => navigate('/applications')}
              className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs transition"
            >
              Done Practice
            </button>
          </div>

        </div>
      ) : (
        /* Question Form wizard */
        <form onSubmit={handleSubmit} className="space-y-5">
          {questions.map((q, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-200">
                <span className="text-indigo-400 font-extrabold">Question {idx + 1}:</span> {q}
              </label>
              <textarea
                value={answers[idx]}
                onChange={(e) => handleAnswerChange(idx, e.target.value)}
                placeholder="Type your detailed engineering answer here..."
                rows={4}
                className="w-full p-3.5 rounded-xl bg-dark-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
              />
            </div>
          ))}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={grading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-primary-500/10 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {grading ? (
                <>Evaluating answers...</>
              ) : (
                <>
                  Submit for Grading <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
