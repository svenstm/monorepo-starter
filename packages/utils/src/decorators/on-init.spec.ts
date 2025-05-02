import { Injectable, OnModuleInit } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OnInit } from './on-init';
import { describe, expect, it } from 'vitest';

describe('on init decorator', () => {

  it('with own onModuleInit', async () => {
    const callstack:string[] = [];

    @Injectable()
    class TestService implements OnModuleInit {

      onModuleInit() {
        callstack.push('original')
      }

      @OnInit()
      async foo() {
        callstack.push('foo')
      }

      @OnInit()
      async bar() {
        callstack.push('bar')
      }
    }

    const module = await Test.createTestingModule({
      providers: [
        TestService
      ]
    }).compile();
    const app = module.createNestApplication();
    await app.init();
    await module.get<TestService>(TestService);

    expect(callstack.length).toBe(3);
    expect(callstack[0]).toBe('foo');
    expect(callstack[1]).toBe('bar');
    expect(callstack[2]).toBe('original');

  });

  it('without onModuleInit', async () => {
    const callstack: string[] = [];

    @Injectable()
    class TestService {

      @OnInit()
      async foo() {
        callstack.push('foo')
      }

      @OnInit()
      async bar() {
        callstack.push('bar')
      }
    }

    const module = await Test.createTestingModule({
      providers: [
        TestService
      ]
    }).compile();
    const app = module.createNestApplication();
    await app.init();
    await module.get<TestService>(TestService);

    expect(callstack.length).toBe(2);
    expect(callstack[0]).toBe('foo');
    expect(callstack[1]).toBe('bar');

  });

});
