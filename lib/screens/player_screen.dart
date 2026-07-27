// Порт `app/screens/player.tsx`. Логика ретраев и ориентации — без изменений.
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../providers/time_provider.dart';
import '../theme/app_theme.dart';

const int _maxRetries = 5;
const int _retryDelayMs = 3000;

const String _injectedJs = '''
  window.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, { passive: false });
''';

class PlayerScreen extends ConsumerStatefulWidget {
  const PlayerScreen({super.key, required this.url, this.animeId});

  final String? url;
  final int? animeId;

  @override
  ConsumerState<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends ConsumerState<PlayerScreen> {
  late final WebViewController _controller;
  bool _loading = true;
  bool _error = false;
  int _attempts = 0;
  bool _retryScheduled = false;

  @override
  void initState() {
    super.initState();

    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

    ref.read(timeProvider.notifier).startTracking();

    if (widget.url != null && widget.url!.isNotEmpty) {
      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(Colors.black)
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageFinished: (_) {
              _controller.runJavaScript(_injectedJs);
              if (mounted) setState(() => _loading = false);
            },
            onWebResourceError: (_) {
              if (!mounted) return;
              setState(() => _error = true);
              _scheduleRetryIfNeeded();
            },
          ),
        )
        ..loadRequest(Uri.parse(widget.url!));
    }
  }

  void _scheduleRetryIfNeeded() {
    if (_error && _attempts <= _maxRetries && !_retryScheduled) {
      _retryScheduled = true;
      setState(() => _loading = true);
      Future.delayed(const Duration(milliseconds: _retryDelayMs), () {
        if (!mounted) return;
        _controller.reload();
        setState(() {
          _attempts += 1;
          _error = false;
          _retryScheduled = false;
        });
      });
    }
  }

  @override
  void dispose() {
    ref.read(timeProvider.notifier).stopTracking();
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final insets = MediaQuery.of(context).viewPadding;
    final horizontalPadding = insets.left > insets.right ? insets.left : insets.right;

    if (widget.url == null || widget.url!.isEmpty) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Text('Видео недоступно', style: TextStyle(fontSize: 16, color: Colors.white)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Padding(
        padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
        child: Stack(
          children: [
            Positioned.fill(child: WebViewWidget(controller: _controller)),
            if (_error || _attempts > _maxRetries)
              const Positioned.fill(
                child: ColoredBox(
                  color: Colors.black,
                  child: Center(
                    child: Text(
                      'Не удалось загрузить видео',
                      style: TextStyle(fontSize: 16, color: Colors.white),
                    ),
                  ),
                ),
              ),
            if ((_loading || _error) && _attempts <= _maxRetries)
              const Positioned.fill(
                child: ColoredBox(
                  color: Colors.black,
                  child: Center(
                    child: CircularProgressIndicator(color: seedColor),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
