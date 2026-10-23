import { describe, it, expect } from 'vitest';
import { ProjectManager } from '../src/storage/ProjectManager';

describe('ProjectManager', () => {
  it('creates a blank project with default tracks, metadata, and routing', () => {
    const pm = new ProjectManager();
    const proj = pm.project;

    expect(proj.metadata.title).toBeDefined();
    expect(proj.metadata.bpm).toBe(128);
    expect(proj.tracks.length).toBeGreaterThanOrEqual(4);
    expect(proj.tracks[0].type).toBe('pattern');
    expect(proj.tracks[1].type).toBe('midi');
    expect(proj.tracks[3].type).toBe('audio');
  });

  it('serializes and deserializes valid project JSON', () => {
    const pm = new ProjectManager();
    pm.project.metadata.title = 'Test Hit Song';
    pm.project.metadata.bpm = 140;

    const json = pm.serialize();
    expect(json).toContain('Test Hit Song');

    const pm2 = new ProjectManager();
    const success = pm2.deserialize(json);
    expect(success).toBe(true);
    expect(pm2.project.metadata.title).toBe('Test Hit Song');
    expect(pm2.project.metadata.bpm).toBe(140);
  });

  it('supports undo and redo stack', () => {
    const pm = new ProjectManager();
    expect(pm.canUndo()).toBe(false);

    pm.project.metadata.bpm = 135;
    pm.pushState();
    expect(pm.canUndo()).toBe(true);

    pm.undo();
    expect(pm.project.metadata.bpm).toBe(128);

    expect(pm.canRedo()).toBe(true);
    pm.redo();
    expect(pm.project.metadata.bpm).toBe(135);
  });
});
